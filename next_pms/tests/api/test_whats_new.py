# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

from unittest.mock import MagicMock, patch

import frappe
import requests
from frappe.tests import IntegrationTestCase

from next_pms.api import whats_new
from next_pms.api.whats_new import (
    CHECKED_CACHE_KEY,
    RELEASES_CACHE_KEY,
    VERSIONS_CACHE_KEY,
    clean_release_html,
    get_release_notes,
    get_whats_new_boot,
    mark_release_notes_seen,
    normalize_release,
    refresh_releases,
)
from next_pms.tests.utils import make_employee

TEST_USER = "test.whatsnew@example.com"


def _body_html(version, date="2026-11-02", body="<h2>New features</h2><p>Something useful.</p>"):
    return f"<h1>v{version}</h1>\n<p><strong>Release date:</strong> {date}</p>\n{body}"


def _github_release(version, published_at="2026-11-02T14:49:50Z", **overrides):
    return {
        "tag_name": f"v{version}",
        "draft": False,
        "prerelease": False,
        "published_at": published_at,
        "body_html": _body_html(version),
        **overrides,
    }


def _github_response(payload):
    response = MagicMock()
    response.json.return_value = payload
    return response


def _clear_cache():
    for key in (RELEASES_CACHE_KEY, VERSIONS_CACHE_KEY, CHECKED_CACHE_KEY):
        frappe.cache.delete_value(key)


class TestCleanReleaseHtml(IntegrationTestCase):
    def test_removes_version_heading_and_release_date(self):
        html = clean_release_html(_body_html("2.13.0"), "2.13.0")

        self.assertNotIn("<h1>", html)
        self.assertNotIn("Release date", html)
        self.assertIn("<h3>New features</h3>", html)

    def test_moves_headings_below_the_release_heading(self):
        body = "<h1>Highlights</h1><h2>New features</h2><h3>A feature</h3><h6>Small print</h6>"

        html = clean_release_html(_body_html("2.13.0", body=body), "2.13.0")

        self.assertIn("<h3>Highlights</h3><h3>New features</h3><h4>A feature</h4><h6>Small print</h6>", html)

    def test_removes_sections_that_only_say_none(self):
        body = "<h2>Breaking changes</h2>\n<p>None.</p>\n<h2>Fixes</h2>\n<p>Fixed the thing.</p>"

        html = clean_release_html(_body_html("2.13.0", body=body), "2.13.0")

        self.assertNotIn("Breaking changes", html)
        self.assertNotIn("None.", html)
        self.assertIn("<h3>Fixes</h3>", html)

    def test_joins_lists_split_by_comments(self):
        body = (
            "<ul><li>One</li></ul>\n<ul><li>Two</li></ul>\n\n<ul><li>Three</li></ul><p>After</p><ul><li>Four</li></ul>"
        )

        html = clean_release_html(_body_html("2.13.0", body=body), "2.13.0")

        self.assertIn(
            "<ul><li>One</li><li>Two</li><li>Three</li></ul><p>After</p><ul><li>Four</li></ul>", html.replace("\n", "")
        )

    def test_removes_contributor_and_reference_sections(self):
        body = (
            "<h2>Fixes</h2><ul><li>Fixed the thing.</li></ul>"
            "<h2>Contributors </h2><p>@someone, @someone-else</p>"
            '<h2>References</h2><ul><li><a href="https://github.com/rtCamp/next-pms/pull/1">#1</a></li></ul>'
        )

        html = clean_release_html(_body_html("2.13.0", body=body), "2.13.0")

        self.assertIn("Fixed the thing.", html)
        for removed in ("Contributors", "@someone", "References", "pull/1"):
            self.assertNotIn(removed, html)

    def test_skips_notes_without_release_template(self):
        changelog = "<h2>What's Changed</h2><ul><li>fix: something by @someone</li></ul>"

        self.assertIsNone(clean_release_html(changelog, "1.0.5"))

    def test_skips_notes_with_only_the_template_header(self):
        self.assertIsNone(clean_release_html(_body_html("2.13.0", body=""), "2.13.0"))

    def test_strips_unsafe_markup_and_opens_links_in_a_new_tab(self):
        body = '<p onclick="steal()">Hi <a href="https://example.com">link</a></p><script>steal()</script>'

        html = clean_release_html(_body_html("2.13.0", body=body), "2.13.0")

        self.assertNotIn("onclick", html)
        self.assertNotIn("<script", html)
        self.assertIn('target="_blank"', html)
        self.assertIn('rel="noopener noreferrer"', html)


class TestNormalizeRelease(IntegrationTestCase):
    def test_returns_version_date_and_html(self):
        release = normalize_release(_github_release("2.13.0"))

        self.assertEqual(release["version"], "2.13.0")
        self.assertEqual(release["date"], "2026-11-02")
        self.assertIn("Something useful.", release["html"])

    def test_skips_releases_that_cannot_be_shown(self):
        unusable = {
            "draft": _github_release("2.14.0", draft=True),
            "prerelease": _github_release("2.14.0", prerelease=True),
            "non-semver tag": _github_release("2.14.0", tag_name="latest"),
            "missing body": _github_release("2.14.0", body_html=None),
            "bad date": _github_release("2.14.0", published_at="soon"),
            "not a dict": "v2.14.0",
        }
        for case, item in unusable.items():
            with self.subTest(case=case):
                self.assertIsNone(normalize_release(item))


class TestRefreshReleases(IntegrationTestCase):
    def setUp(self):
        _clear_cache()
        self.addCleanup(_clear_cache)

    @patch("next_pms.api.whats_new.requests.get")
    def test_caches_showable_releases_newest_first(self, get):
        get.return_value = _github_response(
            [
                _github_release("2.9.0"),
                _github_release("2.13.0"),
                _github_release("2.10.0"),
                _github_release("1.0.5", body_html="<h2>What's Changed</h2>"),
            ]
        )

        releases = refresh_releases()

        self.assertEqual([release["version"] for release in releases], ["2.13.0", "2.10.0", "2.9.0"])
        self.assertEqual(frappe.cache.get_value(VERSIONS_CACHE_KEY), ["2.13.0", "2.10.0", "2.9.0"])
        self.assertTrue(frappe.cache.get_value(CHECKED_CACHE_KEY))

    @patch("next_pms.api.whats_new.requests.get")
    def test_failed_fetch_keeps_last_cached_notes(self, get):
        get.return_value = _github_response([_github_release("2.13.0")])
        refresh_releases()
        frappe.cache.delete_value(CHECKED_CACHE_KEY)

        for failure in (requests.ConnectionError("offline"), requests.HTTPError("403 rate limited")):
            with self.subTest(failure=failure):
                get.side_effect = failure

                self.assertIsNone(refresh_releases())
                self.assertEqual(frappe.cache.get_value(VERSIONS_CACHE_KEY), ["2.13.0"])
                self.assertTrue(frappe.cache.get_value(CHECKED_CACHE_KEY))

    @patch("next_pms.api.whats_new.requests.get")
    def test_unexpected_response_is_a_failed_fetch(self, get):
        get.return_value = _github_response({"message": "Not Found"})

        self.assertIsNone(refresh_releases())
        self.assertIsNone(frappe.cache.get_value(RELEASES_CACHE_KEY))


class TestReleaseNotesApi(IntegrationTestCase):
    def setUp(self):
        _clear_cache()
        self.addCleanup(_clear_cache)
        enqueue_patch = patch("next_pms.api.whats_new.frappe.enqueue")
        self.enqueue = enqueue_patch.start()
        self.addCleanup(enqueue_patch.stop)

    @patch("next_pms.api.whats_new.requests.get", side_effect=requests.ConnectionError("offline"))
    def test_errors_when_nothing_is_cached_and_github_is_unreachable(self, _get):
        with self.assertRaises(frappe.ValidationError):
            get_release_notes()

    @patch("next_pms.api.whats_new.requests.get")
    def test_leaves_out_releases_newer_than_the_installed_app(self, get):
        get.return_value = _github_response([_github_release("2.14.0"), _github_release("2.13.0")])

        with patch.object(whats_new, "__version__", "2.13.0"):
            notes = get_release_notes()

        self.assertEqual(notes["current_version"], "2.13.0")
        self.assertEqual([release["version"] for release in notes["releases"]], ["2.13.0"])

    @patch("next_pms.api.whats_new.requests.get")
    def test_serves_cached_notes_and_refreshes_in_the_background_when_stale(self, get):
        frappe.cache.set_value(RELEASES_CACHE_KEY, [{"version": "2.13.0", "date": "2026-11-02", "html": "<p>x</p>"}])

        with patch.object(whats_new, "__version__", "2.13.0"):
            notes = get_release_notes()

        get.assert_not_called()
        self.enqueue.assert_called_once()
        self.assertEqual(len(notes["releases"]), 1)


class TestWhatsNewBoot(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        make_employee(TEST_USER)

    def setUp(self):
        frappe.db.delete("PMS User Setting", {"user": TEST_USER})
        _clear_cache()
        self.addCleanup(_clear_cache)
        frappe.cache.set_value(VERSIONS_CACHE_KEY, ["2.14.0", "2.13.0", "2.12.0"])
        frappe.cache.set_value(CHECKED_CACHE_KEY, True)
        version_patch = patch.object(whats_new, "__version__", "2.13.0")
        version_patch.start()
        self.addCleanup(version_patch.stop)

    def tearDown(self):
        frappe.set_user("Administrator")

    def _set_last_seen(self, version):
        frappe.get_doc({"doctype": "PMS User Setting", "user": TEST_USER, "whats_new_last_seen": version}).insert(
            ignore_permissions=True
        )

    def test_user_who_never_opened_the_page_sees_the_dot(self):
        self.assertEqual(get_whats_new_boot(TEST_USER), {"whats_new_available": True, "whats_new_unseen": True})

    def test_dot_shows_until_the_latest_installed_release_is_seen(self):
        for last_seen, unseen in (("2.12.0", True), ("2.13.0", False), ("not-a-version", True)):
            with self.subTest(last_seen=last_seen):
                frappe.db.delete("PMS User Setting", {"user": TEST_USER})
                self._set_last_seen(last_seen)
                self.assertEqual(get_whats_new_boot(TEST_USER)["whats_new_unseen"], unseen)

    def test_hidden_when_no_notes_are_cached(self):
        frappe.cache.delete_value(VERSIONS_CACHE_KEY)

        self.assertEqual(get_whats_new_boot(TEST_USER), {"whats_new_available": False, "whats_new_unseen": False})

    def test_hidden_when_only_newer_releases_are_cached(self):
        frappe.cache.set_value(VERSIONS_CACHE_KEY, ["2.14.0"])

        self.assertFalse(get_whats_new_boot(TEST_USER)["whats_new_available"])

    def test_hidden_for_guest(self):
        self.assertFalse(get_whats_new_boot("Guest")["whats_new_available"])

    @patch("next_pms.api.whats_new.frappe.enqueue", side_effect=ConnectionError("queue down"))
    def test_boot_survives_a_failed_background_refresh(self, enqueue):
        frappe.cache.delete_value(CHECKED_CACHE_KEY)

        self.assertTrue(get_whats_new_boot(TEST_USER)["whats_new_available"])
        enqueue.assert_called_once()

    def test_mark_seen_records_the_latest_installed_release(self):
        self._set_last_seen("2.12.0")
        frappe.set_user(TEST_USER)
        mark_release_notes_seen()
        frappe.set_user("Administrator")

        self.assertEqual(frappe.db.get_value("PMS User Setting", TEST_USER, "whats_new_last_seen"), "2.13.0")
        self.assertFalse(get_whats_new_boot(TEST_USER)["whats_new_unseen"])
