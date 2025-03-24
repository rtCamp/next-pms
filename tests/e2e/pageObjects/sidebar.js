/**
 * Sidebar class handles interactions with the sidebar available on all pages.
 */
export class Sidebar {
  /**
   * Initializes the LoginPage object.
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // Sidebar elements
    this.homeLink = page.getByRole("link", { name: "Home" });
    this.timesheetLink = page.getByRole("link", { name: "Timesheet" });
    this.teamLink = page.getByRole("link", { name: "Team" });
    this.projectLink = page.getByRole("link", { name: "Project" });
    this.taskLink = page.getByRole("link", { name: "Task" });
  }

  // --------------------------------------
  // Sidebar Actions
  // --------------------------------------

  /**
 * Checks if a tab with the specified name is available in sidebar.

 */
  async isTabAvailable(name) {
    await this.page.waitForSelector("#app-logo");

    return this.page.getByRole("link", { name: `${name}` }).isVisible();
  }
}
