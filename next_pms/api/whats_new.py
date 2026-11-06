from datetime import date

import frappe
import nh3
import requests
from bs4 import BeautifulSoup, NavigableString
from frappe import _
from semantic_version import Version

from next_pms import __version__
from next_pms.next_pms.doctype.pms_user_setting.pms_user_setting import _get_or_create_settings

RELEASES_URL = "https://api.github.com/repos/rtCamp/next-pms/releases"
RELEASES_PER_PAGE = 30
REQUEST_TIMEOUT = 5

RELEASES_CACHE_KEY = "next_pms:whats_new:releases"
VERSIONS_CACHE_KEY = "next_pms:whats_new:versions"
CHECKED_CACHE_KEY = "next_pms:whats_new:checked"
REFRESH_JOB_ID = "next_pms:whats_new:refresh"
HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"]
DEVELOPER_SECTIONS = {"contributors", "references"}
FRESH_FOR = 6 * 60 * 60
RETRY_AFTER = 15 * 60


def parse_version(value) -> Version | None:
    """Parse a version or release tag (`2.13.0` or `v2.13.0`), returning None when it isn't semver."""
    if not isinstance(value, str):
        return None
    try:
        return Version(value.removeprefix("v"))
    except ValueError:
        return None


def section_content(heading) -> list:
    """Everything under a heading, up to the next heading of the same or a higher level."""
    level = int(heading.name[1])
    content = []
    for sibling in heading.next_siblings:
        if sibling.name in HEADING_TAGS and int(sibling.name[1]) <= level:
            break
        content.append(sibling)
    return content


def is_hidden_section(heading) -> bool:
    """Whether a section is for developers (contributors, references) or only says "None."."""
    if heading.get_text(strip=True).lower() in DEVELOPER_SECTIONS:
        return True
    text = "".join(node.get_text() for node in section_content(heading))
    return text.strip().rstrip(".").lower() == "none"


def merge_adjacent_lists(soup: BeautifulSoup) -> None:
    """Join lists that GitHub split apart, e.g. at an HTML comment between bullets."""
    for listing in soup.find_all(["ul", "ol"]):
        if listing.decomposed:
            continue
        sibling = listing.next_sibling
        while isinstance(sibling, NavigableString) and not sibling.strip():
            sibling = sibling.next_sibling
        while sibling is not None and sibling.name == listing.name:
            following = sibling.next_sibling
            while isinstance(following, NavigableString) and not following.strip():
                following = following.next_sibling
            for item in list(sibling.children):
                listing.append(item.extract())
            sibling.decompose()
            sibling = following


def clean_release_html(html: str, version: str) -> str | None:
    """Sanitize a release's GitHub-rendered notes for the What's new page.

    Only notes written with the release template (a `**Release date:**` line) are shown,
    so auto-generated changelogs of commits and pull requests are left out. The template's
    version heading and release date line are removed because the page shows both, and so
    are developer sections (contributors, references) and sections that only say "None.". Lists split by GitHub are joined again. Headings start at `h3` because each release sits
    under the page's `h1` and its own `h2`.

    Args:
        html: The release's `body_html` from the GitHub API.
        version: The release version, without the `v` prefix.

    Returns:
        str | None: Safe HTML, or None when the notes don't follow the release template.
    """
    safe_html = nh3.clean(html, set_tag_attribute_values={"a": {"target": "_blank"}})
    soup = BeautifulSoup(safe_html, "html.parser")
    release_date = next(
        (paragraph for paragraph in soup.find_all("p") if paragraph.get_text(strip=True).startswith("Release date:")),
        None,
    )
    if not release_date:
        return None

    release_date.decompose()
    for heading in soup.find_all("h1"):
        if parse_version(heading.get_text(strip=True)) == Version(version):
            heading.decompose()
    for heading in soup.find_all(["h2", "h3"]):
        if not heading.decomposed and is_hidden_section(heading):
            for node in section_content(heading):
                node.extract()
            heading.decompose()
    merge_adjacent_lists(soup)
    for heading in soup.find_all(HEADING_TAGS):
        heading.name = f"h{min(max(int(heading.name[1]) + 1, 3), 6)}"
    return str(soup).strip() or None


def normalize_release(item) -> dict | None:
    """Turn one GitHub release into `{version, date, html}`, or None if it can't be shown."""
    if not isinstance(item, dict) or item.get("draft") or item.get("prerelease"):
        return None

    version = parse_version(item.get("tag_name"))
    published_at = item.get("published_at")
    html = item.get("body_html")
    if not version or not isinstance(published_at, str) or not isinstance(html, str):
        return None

    try:
        published_on = date.fromisoformat(published_at[:10])
    except ValueError:
        return None

    notes = clean_release_html(html, str(version))
    if not notes:
        return None
    return {"version": str(version), "date": published_on.isoformat(), "html": notes}


def fetch_releases() -> list[dict]:
    """Fetch the published release notes from GitHub, newest first.

    Raises:
        requests.RequestException: GitHub couldn't be reached or answered with an error.
        ValueError: GitHub's response wasn't a list of releases.
    """
    response = requests.get(
        RELEASES_URL,
        params={"per_page": RELEASES_PER_PAGE},
        headers={"Accept": "application/vnd.github.html+json", "X-GitHub-Api-Version": "2022-11-28"},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list):
        raise ValueError("GitHub's releases response isn't a list")

    releases = [release for item in payload if (release := normalize_release(item))]
    return sorted(releases, key=lambda release: Version(release["version"]), reverse=True)


def refresh_releases() -> list[dict] | None:
    """Fetch release notes from GitHub and cache them.

    A failed fetch keeps the notes cached by the last successful one and waits
    `RETRY_AFTER` seconds before the next background attempt.

    Returns:
        list[dict] | None: The fetched releases, or None when the fetch failed.
    """
    try:
        releases = fetch_releases()
    except (requests.RequestException, ValueError) as error:
        frappe.logger("next_pms").warning(f"Couldn't fetch release notes from GitHub: {error}")
        releases = None
    except Exception:
        frappe.log_error(title="Couldn't refresh What's new release notes")
        releases = None

    if releases is None:
        frappe.cache.set_value(CHECKED_CACHE_KEY, True, expires_in_sec=RETRY_AFTER)
        return None

    frappe.cache.set_value(RELEASES_CACHE_KEY, releases)
    frappe.cache.set_value(VERSIONS_CACHE_KEY, [release["version"] for release in releases])
    frappe.cache.set_value(CHECKED_CACHE_KEY, True, expires_in_sec=FRESH_FOR)
    return releases


def refresh_releases_if_stale() -> None:
    """Queue a background refresh when the cached release notes are due one."""
    if frappe.cache.get_value(CHECKED_CACHE_KEY):
        return
    try:
        frappe.enqueue(refresh_releases, queue="short", job_id=REFRESH_JOB_ID, deduplicate=True)
    except Exception:
        frappe.logger("next_pms").warning("Couldn't queue the What's new refresh", exc_info=True)


def is_installed(version: str) -> bool:
    """Whether a release is part of the app installed on this site."""
    parsed = parse_version(version)
    return parsed is not None and parsed <= Version(__version__)


def get_available_versions() -> list[str]:
    """Versions of the cached release notes this site has installed, newest first."""
    return [version for version in frappe.cache.get_value(VERSIONS_CACHE_KEY) or [] if is_installed(version)]


def has_unseen_release(user: str, latest_version: str) -> bool:
    """Whether the user hasn't opened What's new since `latest_version` was released."""
    last_seen = parse_version(frappe.db.get_value("PMS User Setting", user, "whats_new_last_seen"))
    return last_seen is None or Version(latest_version) > last_seen


def get_whats_new_boot(user: str) -> dict:
    """Boot flags for the What's new entry points.

    Reads only the cache, so a slow or unreachable GitHub never delays page load.
    Until release notes are cached, the entry points stay hidden.

    Args:
        user: User ID the boot data is built for.

    Returns:
        dict:
            - whats_new_available: Whether there are release notes to show.
            - whats_new_unseen: Whether to show the unread dot.
    """
    if user == "Guest":
        return {"whats_new_available": False, "whats_new_unseen": False}

    refresh_releases_if_stale()
    versions = get_available_versions()
    return {
        "whats_new_available": bool(versions),
        "whats_new_unseen": bool(versions) and has_unseen_release(user, versions[0]),
    }


@frappe.whitelist(methods=["GET"])
def get_release_notes() -> dict:
    """Return the release notes for the What's new page.

    Serves the cached notes and refreshes them in the background when stale.
    With nothing cached yet, fetches from GitHub while the user waits.

    Returns:
        dict:
            - current_version: Version of the app installed on this site.
            - releases: Installed releases as `{version, date, html}`, newest first.
    """
    releases = frappe.cache.get_value(RELEASES_CACHE_KEY)
    if releases is None:
        releases = refresh_releases()
        if releases is None:
            frappe.throw(_("Couldn't load release notes from GitHub. Try again in a few minutes."))
    else:
        refresh_releases_if_stale()

    return {
        "current_version": __version__,
        "releases": [release for release in releases if is_installed(release["version"])],
    }


@frappe.whitelist(methods=["POST"])
def mark_release_notes_seen() -> None:
    """Record the latest installed release as seen by the current user."""
    versions = get_available_versions()
    if not versions:
        return
    settings = _get_or_create_settings()
    settings.db_set("whats_new_last_seen", versions[0])
