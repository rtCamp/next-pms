import { expect } from "@playwright/test";
import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";

const BASE = "/next-pms";

/**
 * What every page shares: the sidebar, global search, notifications tray, the header menu,
 * and the not-found page a role-protected route sends the wrong role to.
 */
export class NavigationPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.headerMenu = page.getByRole("button", { name: /Next PMS/ }).first();
    this.searchButton = page.getByRole("button", {
      name: "Search",
      exact: true,
    });
    this.notificationsButton = page.getByRole("button", {
      name: "Notifications",
      exact: true,
    });

    this.searchInput = page.getByPlaceholder("Search or type a command");
    this.searchResults = page.getByRole("option");
    this.noSearchResults = page.getByText("No results found.", { exact: true });

    this.tray = page.getByRole("dialog", { name: "Notifications" });
    this.trayItems = this.tray.getByRole("link");
    this.markAllRead = this.tray.getByRole("button", {
      name: "Mark all as read",
    });
    this.closeTray = this.tray.getByRole("button", {
      name: "Close notifications tray",
    });

    this.notFoundHeading = page.getByRole("heading", { name: "404" });
    this.noEmployeeHeading = page.getByRole("heading", {
      name: "Access Restricted",
    });
  }

  // --------------------------------------
  // Navigate
  // --------------------------------------

  /** Opens an app route and waits for the sidebar, which every signed-in page shows. */
  async goto(route = "/timesheet") {
    await gotoWithRetry(this.page, `${BASE}${route}`);
    await this.headerMenu.waitFor({ timeout: scaleTimeout(40000) });
  }

  /** Opens an app route a role may be sent away from, and waits for where it settles. */
  async visit(route) {
    await gotoWithRetry(this.page, `${BASE}${route}`);
  }

  /** Asserts the route opened: its page title is set once the route renders. */
  async expectReached(title) {
    await expect(this.page).toHaveTitle(`${title} | Next PMS`, {
      timeout: scaleTimeout(40000),
    });
    await expect(this.notFoundHeading).toHaveCount(0);
  }

  /** Asserts the route sent the user to the not-found page. */
  async expectNotFound() {
    await expect(this.page).toHaveURL(new RegExp(`${BASE}/not-found`), {
      timeout: scaleTimeout(40000),
    });
    await expect(this.notFoundHeading).toBeVisible();
  }

  // --------------------------------------
  // Sidebar
  // --------------------------------------

  /** A sidebar link to an app route, with or without the query the sidebar adds. */
  link(route) {
    const href = `${BASE}${route}`;
    return this.page.locator(`a[href="${href}"], a[href^="${href}?"]`);
  }

  /** The text of the section headings the sidebar shows. */
  sectionHeading(name) {
    return this.page.getByRole("heading", { level: 3, name, exact: true });
  }

  // --------------------------------------
  // Global search
  // --------------------------------------

  async openSearch() {
    await this.searchButton.click();
    await this.searchInput.waitFor({ timeout: scaleTimeout(15000) });
  }

  /** The destinations the search lists for a query (it lists five at a time without one). */
  async searchFor(query) {
    await this.searchInput.fill(query);
    const needle = query.toLowerCase();
    // The list still shows the last query's results for a moment after the typing.
    await expect
      .poll(async () => {
        const texts = await this.searchResults.allInnerTexts();
        if (texts.length === 0) return (await this.noSearchResults.count()) > 0;
        return texts.every((text) => text.toLowerCase().includes(needle));
      })
      .toBe(true);
    return this.searchResults.allInnerTexts();
  }

  // --------------------------------------
  // Notifications and the user menu
  // --------------------------------------

  async openTray() {
    await this.notificationsButton.click();
    await this.tray.waitFor({ timeout: scaleTimeout(15000) });
  }

  trayItem(title) {
    return this.trayItems.filter({ hasText: title });
  }

  async chooseFromMenu(item) {
    await this.headerMenu.click();
    await this.page.getByRole("menuitem", { name: item, exact: true }).click();
  }
}
