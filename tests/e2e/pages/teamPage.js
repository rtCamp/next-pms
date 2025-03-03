/**
 * TeamPage class handles interactions with the team page.
 */
export class TeamPage {
  /**
   * Initializes the TeamPage object.
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // Header Filters
    this.searchInput = page.getByPlaceholder("Employee Name");
  }

  /**
   * Navigates to the team page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/team");
    await this.page.waitForLoadState();
  }

  /**
   * Searches for an employee in the search input.
   */
  async seearchEmployee(name) {
    await this.searchInput.fill(name);
    await this.searchInput.press("ArrowDown+Enter");
  }

  /**
   * Navigates to the employee's timesheet.
   */
  async navigateToEmpTimesheet(name) {
    await this.seearchEmployee(name);
    await this.page.locator(`//p[text()='${name}']`).click();
    await this.page.waitForLoadState();
  }
}
