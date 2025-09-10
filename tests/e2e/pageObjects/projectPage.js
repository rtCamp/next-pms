import { expect } from "allure-playwright";
import path from "path";
import { readJSONFile } from "../utils/fileUtils.js";

export class ProjectPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    //Search bar on project page
    this.searchBar = page.getByRole("textbox", { name: "Project Name" });
    //List of projects displayed in the project table
    this.projectListItems = page.locator("//table//tbody//tr//td[1]//p");

    //Filter options for project tab
    this.projectTypeFilter = page.getByRole("button", { name: "Project Type" });
    this.businessUnitFilter = page.getByRole("button", { name: "Business Unit" });
    this.billingTypeFilter = page.getByRole("button", { name: "Billing Type" });
    this.currencyFilter = page.getByRole("button", { name: "Currency" });
    this.statusFilter = page.getByRole("button", { name: "Status" });

    //Filter search bar
    this.projectTypeSearchBar = page.getByPlaceholder("Project Type");
    this.businessUnitSearchBar = page.getByPlaceholder("Business Unit");
    this.billingTypeSearchBar = page.getByPlaceholder("Billing Type");
    this.currencySearchBar = page.getByPlaceholder("Currency");
    this.statusSearchBar = page.getByPlaceholder("Status");

    //Select filter option
    this.selectFilterOption = (filterOption) => page.getByRole("option", { name: `${filterOption}` });

    //Filter Clear Selection
    this.filterClearSelection = page.getByRole("button", { name: "Clear Selection" });

    //Sort by Button
    this.sortByButton = (buttonText) => page.locator(`//button[text()="${buttonText}"]`);

    //Columns Button
    this.columnsButton = page.getByRole("button", { name: "Columns" });

    // Locator for "No results"
    this.noResultsCell = page.getByRole("cell", { name: "No results" });

    //More Actions
    this.moreActionsButton = page.getByRole("button", { name: "More Actions" });

    //Create View
    this.createViewButton = page.getByText("Create View");
    this.viewNameInput = page.getByRole("textbox", { name: "eg: My custom view" });
    this.createButton = page.getByRole("button", { name: "Create" });

    //Delete View
    this.deleteViewButton = page.getByText("Delete View");

    //Private Views
    this.privateViewsButton = page.getByRole("button", { name: "Private Views" });

    //Public views
    this.publicViewsButton = page.getByRole("button", { name: "Public Views" });

    this.gotoPublicView = (publicViewName) => page.locator(`a[title="${publicViewName}"]`);

    //List of projects displayed in the Retainer public view
    this.projectListItemsInRetainerView = page.locator("//table//tbody//tr//td[2]//p");

    //Toast Notification
    this.toastNotification = (notificationMessage) => page.locator(`//div[text()="${notificationMessage}"]`);

    //Project table headers
    this.projectTableHeader = (headerName) => page.locator("div").filter({ hasText: new RegExp(`^${headerName}$`) });

    //Project row locators
    this.projectRow = (projectName) => page.locator(`xpath=//p[@title="${projectName}"]/ancestor::tr`);

    this.projectNameCell = (projectName) => page.getByTitle(`${projectName}`, { exact: true });

    this.projectTypeCell = (projectName, projectType) =>
      this.projectRow(projectName).locator(`xpath=.//p[@title="${projectType}"]`);

    this.statusCell = (projectName, status) =>
      this.projectRow(projectName).locator(`xpath=.//td//div[normalize-space(text())="${status}"]`);

    this.businessUnitCell = (projectName, businessUnit) =>
      this.projectRow(projectName).locator(`xpath=.//p[@title="${businessUnit}"]`);

    this.billingTypeCell = (projectName, billingType) =>
      this.projectRow(projectName).locator(`xpath=.//td//div[normalize-space(text())="${billingType}"]`);

    this.currencyCell = (projectName, currency) =>
      this.projectRow(projectName).locator(`xpath=.//p[@title="${currency}"]`);

    //Sort data in ascending order
    this.sortAscending = page.locator('section svg[class*="arrow-down-az"]');
    //Sort data in descending order
    this.sortDescending = page.locator('section svg[class*="arrow-down-za"]');
  }
  /**
   * Loads test data from a JSON file.
   * @param {string} jsonDir - Directory containing JSON files.
   * @param {string} fileName - Name of the JSON file to load.
   * @returns {Object} Parsed JSON data.
   */
  async loadTestData(jsonDir, fileName) {
    const stubPath = path.join(jsonDir, fileName);
    const data = await readJSONFile(stubPath);
    return data;
  }

  /**
   * Navigates to the project page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/project", { waitUntil: "domcontentloaded" });
  }

  /**
   * Perform a search using the search bar.
   * @param {string} query - The search query.
   */
  async searchProject(query) {
    await this.searchBar.fill(query);
    await this.searchBar.press("Enter"); // Simulate pressing Enter to trigger the search
    await this.page.waitForLoadState("networkidle"); // Wait for the search results to load
  }

  /**
   * Get the list of project names currently displayed.
   */
  async getProjectList() {
    await this.page.waitForLoadState("networkidle");
    const projectNames = await this.projectListItems.allTextContents();
    const totalCount = projectNames.length;
    return { projectNames, totalCount };
  }

  /**
   * Check if the "No results" message is visible.
   * @returns {Promise<boolean>} - True if "No results" is visible, false otherwise.
   */
  async isNoResultsVisible() {
    // Wait for the "No results" cell to be present in the DOM
    await expect(this.noResultsCell).toBeVisible({ timeout: 10000 });
    return await this.noResultsCell.isVisible();
  }

  /**
   * Apply all filters provided.
   * @param {Object} filters - e.g. { projectType, businessUnit, billingType, currency }
   */
  // Inside your Page Object class
  async applyFilters(filters) {
    const configs = [
      {
        key: "projectType",
        button: this.projectTypeFilter,
        search: this.projectTypeSearchBar,
      },
      {
        key: "status",
        button: this.statusFilter,
        search: this.statusSearchBar,
      },
      {
        key: "businessUnit",
        button: this.businessUnitFilter,
        search: this.businessUnitSearchBar,
      },
      {
        key: "billingType",
        button: this.billingTypeFilter,
        search: this.billingTypeSearchBar,
      },
      {
        key: "currency",
        button: this.currencyFilter,
        search: this.currencySearchBar,
      },
    ];

    for (const { key, button, search } of configs) {
      const rawValue = filters[key];
      if (!rawValue) continue;

      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      if (values.length === 0) continue;

      try {
        await button.click({ timeout: 30000 });
      } catch (e) {
        console.error(`Failed to click filter button for "${key}": ${e}`);
        continue;
      }

      for (const v of values) {
        try {
          await search.fill(v, { timeout: 30000 });
          const option = this.page.getByRole("option", { name: v });
          await option.waitFor({ state: "visible", timeout: 30000 });
          await option.click();
        } catch (e) {
          console.error(`Failed to select value "${v}" for filter "${key}": ${e}`);
        }
      }

      // Only attempt to escape if filterClearSelection is visible
      try {
        if (await this.filterClearSelection.isVisible({ timeout: 2000 })) {
          await this.page.keyboard.press("Escape");
          // Wait a moment for dropdown to close
          await this.page.waitForTimeout(300);
        }
      } catch {
        // Skip if not visible or if error
      }
    }
  }

  /**
   * Clears specified filter dropdowns by clicking on each and selecting 'Clear Selection'
   * @param {Array<string>} filtersToClear - Array of filter names like ['projectType', 'currency']
   */
  async clearFilters(filtersToClear = []) {
    const filterMap = {
      projectType: this.projectTypeFilter,
      status: this.statusFilter,
      businessUnit: this.businessUnitFilter,
      billingType: this.billingTypeFilter,
      currency: this.currencyFilter,
    };

    for (const filterName of filtersToClear) {
      const btn = filterMap[filterName];
      if (!btn) {
        console.warn(`Unknown filter: ${filterName}`);
        continue;
      }

      await btn.click();

      // Only click clear if visible (i.e., filter is actually applied)
      if (await this.filterClearSelection.isVisible()) {
        await this.filterClearSelection.click();
      }

      // Short wait to ensure UI updates
      await this.page.waitForTimeout(150);
    }
  }

  /**
   * Create a private view
   * @param {string} viewName - The name of the view to create.
   */
  async createPrivateView(viewName) {
    await this.moreActionsButton.click();
    await this.createViewButton.click();
    await this.viewNameInput.fill(viewName);
    await this.createButton.click();
    // Wait for the view to be created and the page to update
    await this.page.waitForLoadState("networkidle");

    // Check if the view was created successfully from private views
    await this.privateViewsButton.click();
    await this.page.getByRole("link").filter({ hasText: viewName }).click();
    await expect(this.page.getByRole("link").filter({ hasText: viewName })).toBeVisible();
  }
  /**
   * Delete a view by its name.
   * @param {string} viewName - The name of the view to delete.
   */
  async deletePrivateView(viewName, notification) {
    await this.privateViewsButton.click();
    //Click on private view button if view name is not visible
    if (!(await this.page.getByRole("link").filter({ hasText: viewName }).isVisible())) {
      await this.privateViewsButton.click();
    }
    await this.page.getByRole("link").filter({ hasText: viewName }).click();
    await this.moreActionsButton.click();
    await this.deleteViewButton.click();
    // Wait for the deletion confirmation dialog to appear and confirm deletion
    await this.toastNotification(notification).waitFor({ state: "visible" });
    await expect(this.toastNotification(notification)).toBeVisible();
  }
  /**
   * Create a project using the provided payload.
   * @param {Object} payload - The project data to create.
   */
  async createProject(payload) {
    await this.page.getByRole("button", { name: "Project", exact: true }).click();
    await this.page.getByRole("textbox", { name: "New Project" }).fill(payload.project_name);
    await this.page.getByRole("button", { name: "Add Project" }).click();
    await expect(this.toastNotification("Project created successfully")).toBeVisible();
    await expect(this.page.locator("tbody")).toContainText(payload.project_name);
  }
  /**
   * Check if the column header is visible. If not visible, it will include the column header.
   */
  async isColumnHeaderVisible(headerName) {
    const headerLocator = this.projectTableHeader(headerName);

    if (!(await headerLocator.isVisible())) {
      // If the header is not visible, include it in the table
      await this.page.getByRole("button", { name: "Columns" }).click();
      await this.page.getByRole("menuitem", { name: "Add Columns" }).click();
      await this.page.getByRole("menuitem", { name: headerName, exact: true }).click();
      await this.page.getByRole("menuitem", { name: "Add Columns" }).press("Escape");
    }
    await expect(headerLocator).toBeVisible();
  }
  /**
   * Verifies that all specified column headers are visible.
   * @param {string[]} columns - Array of column names to check.
   */
  async verifyColumnHeaders(columns) {
    for (const column of columns) {
      await this.isColumnHeaderVisible(column);
    }
  }
  /**
   * Get the list of project names currently displayed in the retainer public view.
   */
  async getProjectListInRetainerView() {
    const projectNames = await this.projectListItemsInRetainerView.allTextContents();
    const totalCount = projectNames.length;
    return { projectNames, totalCount };
  }
}
