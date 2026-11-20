import { escapeRegExp } from "../utils/stringUtils";

/**
 * The What's new page: one card per installed release, newest first. The latest is open
 * and has no toggle; an older one opens and closes from its header button.
 */
export class WhatsNewPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: "What's new" });
    this.installedVersion = page.getByText(/^You're on v/);
    // Each card is a <section> named by its version heading.
    this.releases = page.getByRole("region", { name: /^v\d+\.\d+\.\d+/ });
  }

  /** The versions the cards show, top to bottom, e.g. "v2.14.0". */
  async versions() {
    return (await this.releases.allInnerTexts()).map(
      (text) => text.trim().split(/\s/)[0],
    );
  }

  release(version) {
    return this.page.getByRole("region", {
      name: new RegExp(`^v${escapeRegExp(version)}$`),
    });
  }

  /** The header button of an older release. */
  toggle(version) {
    return this.release(version).getByRole("button");
  }

  /** The rendered notes; `.release-notes` is the class that styles the release's HTML. */
  notes(version) {
    return this.release(version).locator(".release-notes");
  }

  latestBadge(version) {
    return this.release(version).getByText("Latest", { exact: true });
  }
}
