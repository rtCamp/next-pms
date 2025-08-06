/**
 * Represents the Project page in the resource management section.
 * Extends the TimelinePage and provides methods for navigating to and verifying the project page.
 */
import { expect } from "@playwright/test";
import { TimelinePage } from "./timeline";
import { getShortFormattedDate, getWeekdayName } from "../../utils/dateUtils";
export class ProjectPage extends TimelinePage {
  constructor(page) {
    super(page);
    this.filterByProjectInput = page.getByRole("textbox", { name: "Project Name" });

    //Search bar on project page
    this.searchBar = page.getByRole("textbox", { name: "Project Name" });

    // filter dropdown
    this.customerFilter = page.getByRole("button", { name: "Customer" });
    this.billingTypeFilter = page.getByRole("button", { name: "Billing Type" });
    this.allocationTypeFilter = page.getByRole("button", { name: "Allocation Type" });
    this.sheetViewFilter = page.getByRole("combobox");
    this.sheetViewFilterText = this.sheetViewFilter.locator("span");

    //Combined Week hours
    this.combineWeekHoursCheckbox = page.locator("#combineWeekHours");

    // Prev & Next Buttons
    this.prevButton = page.getByRole("button", { name: "previous-week" });
    this.nextButton = page.getByRole("button", { name: "next-week" });

    // Header range spans (week ranges)
    this.weekRangeSpans = page.locator("thead span.text-primary.text-xs");

    // Header day/date cells (day headers)
    this.dayHeaderSpans = page.locator("thead th > span");

    //Search bar inside filter dropdown
    this.customerSearchBar = page.getByPlaceholder("Customer");
    this.billingTypeSearchBar = page.getByPlaceholder("Billing Type");
    this.allocationTypeSearchBar = page.getByPlaceholder("Allocation Type");

    //Filter Clear Selection
    this.filterClearSelection = page.getByRole("button", { name: "Clear Selection" });

    //table elements
    this.projectNameCell = (projectName) => page.getByTitle(`${projectName}`, { exact: true });
    this.employeeNameCell = (employeeName) => page.getByTitle(`${employeeName}`, { exact: true });
    this.projectTableTitle = page.getByRole("cell", { name: "Projects" });
    this.deleteButton = page.getByRole("img", { name: "Delete" }).first();
    this.editIcon = page.getByRole("img", { name: "Edit" }).first();
    this.clipboardIcon = page.getByRole("img", { name: "Copy" }).first();

    //List of projects displayed in the project table that have title
    this.projectListItems = page.locator("//h3//td//p[@title]");

    //Locator targetting the total hours text field in the allocation modal
    this.projectNameWithDate = (projectName, startDate) => {
      const dateObj = new Date(startDate);
      const shortDate = getShortFormattedDate(dateObj); // e.g., "Aug 4"
      const day = getWeekdayName(dateObj); // e.g., "Mon"
      const fullTitle = `${projectName} (${shortDate} - ${day})`;

      return this.page.locator(`td p[title="${fullTitle}"]`);
    };

    //Spinner
    this.spinner = page.locator("svg.animate-spin");
  }

  /**
   * Navigates to the project page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/resource-management/project", { waitUntil: "domcontentloaded" });
  }

  /**
   * Verifies that the page is visible and the project table title is displayed.
   */
  async isPageVisible() {
    await expect(this.projectTableTitle).toBeVisible();
  }

  /**
   * Filters the project table by the given project name.
   */
  async filterByProject(projectName) {
    await this.filterByProjectInput.click();
    await this.filterByProjectInput.fill(projectName);
    await this.page.waitForTimeout(1000); // added to avoid flaky test
  }

  /**
   * Adds an allocation for a specific employee by clicking on their cell and filling the allocation form.
   */
  async addAllocationFromProjectTab(projectName, customerName, employeeName, date, day, allocation = "8") {
    if (!(await this.filterByProjectInput.isVisible())) {
      await this.filterByProject(projectName);
    }
    let allotmentDate = date;
    let allotmentDay = day;

    await this.page.getByTitle(`${projectName} (${allotmentDate} - ${allotmentDay})`).click();
    await this.selectEmployee(employeeName);
    await this.selectCustomer(customerName);
    await this.selectProject(customerName, projectName);
    await this.setHoursPerDay(allocation);

    // Wait for the allocation API response and click the create button in parallel
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/method/next_pms.resource_management.api.allocation.handle_allocation") &&
          response.status() === 200
      ),
      this.clickCreateButton(),
    ]);

    const responseBody = await response.json();
    const allocationName = responseBody.message.name;
    return { allocationName };
  }

  /**
   * Delete the allocation added.
   */
  async deleteAllocationFromProjectTab(projectName, date, day) {
    await this.page.waitForTimeout(1000);
    await this.page.getByTitle(`${projectName} (${date} - ${day})`).hover();
    await this.deleteButton.click();
    await this.confirmDeleteButton.click();
  }

  /**
   * Click on the clipboard icon on hover
   */
  async clickClipboardIcon(projectName, date, day) {
    await this.page.waitForTimeout(1000);
    await this.page.getByTitle(`${projectName} (${date} - ${day})`).hover();
    await this.clipboardIcon.click();
  }

  /**
   * Click on the edit icon on hover
   */
  async clickEditIcon(projectName, date, day) {
    await this.page.waitForTimeout(1000);
    await this.page.getByTitle(`${projectName} (${date} - ${day})`).hover();
    await this.editIcon.click();
  }

  /**
   * Add a allocated time on a add allocation modal
   */
  async addAllocationFromProjectTabFromClipboard(hoursPerDay, totalAllocatedHours = "100") {
    this.totalHoursTextField.fill("");
    this.totalHoursTextField.fill(totalAllocatedHours);
    await this.setHoursPerDay(hoursPerDay);
    // Wait for the allocation API response and click the create button in parallel
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/method/next_pms.resource_management.api.allocation.handle_allocation") &&
          response.status() === 200
      ),
      this.clickCreateButton(),
    ]);

    const responseBody = await response.json();
    const updatedAllocationName = responseBody.message.name;
    return { updatedAllocationName };
  }

  /**
   * Edit a allocated time on a add allocation modal
   */
  async editAllocationFromProjectTab(hoursPerDay, totalAllocatedHours = "100") {
    this.totalHoursTextField.fill("");
    this.totalHoursTextField.fill(totalAllocatedHours);
    await this.setHoursPerDay(hoursPerDay);
  }

  /**
   * Get an allocation time from Project page using project name and allocation date
   */
  async getAllocationFromProjectTab(projectName, date, day) {
    await this.page.waitForTimeout(1000);
    const allocationTime = await this.page.getByTitle(`${projectName} (${date} - ${day})`).textContent();
    return allocationTime;
  }
  /**
   * Wait for Spinner to disappear
   */
  async waitForSpinnerTodisappear() {
    // Wait for spinner to disappear
    if (await this.spinner.isVisible().catch(() => false)) {
      await this.spinner.waitFor({ state: "hidden" });
    }
  }

  /**
   * Retrieves a list of project titles from the project list items.
   */
  async getProjectList() {
    const titles = [];
    await this.waitForSpinnerTodisappear();
    const count = await this.projectListItems.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const title = await this.projectListItems.nth(i).getAttribute("title");
      titles.push(title);
    }

    return {
      totalCount: titles.length,
      projectNames: titles,
    };
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
   * Clears specified filter dropdowns by clicking on each and selecting 'Clear Selection'
   * If no filters are specified, all filters will be cleared.
   * @param {Array<string>} filtersToClear - Array of filter names like ['projectType', 'currency']
   */
  async clearFilters(filtersToClear) {
    const filterMap = {
      customer: this.customerFilter,
      billingType: this.billingTypeFilter,
      allocationType: this.allocationTypeFilter,
    };

    // If no filters specified, default to all filters in the map
    const filters = filtersToClear?.length ? filtersToClear : Object.keys(filterMap);

    for (const filterName of filters) {
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
      //If the filter button is still visible do filterClearSelection.press("Escape") to close the dropdown
      if (await this.filterClearSelection.isVisible()) {
        await this.filterClearSelection.press("Escape");
      }

      // Short wait to ensure UI updates
      await this.page.waitForTimeout(150);
    }
  }
  /**
   * Apply all filters provided.
   * @param {Object} filters - e.g. { projectType, businessUnit, billingType, currency }
   */
  // Inside your Page Object class
  async applyFilters(filters) {
    const configs = [
      {
        key: "customer",
        button: this.customerFilter,
        search: this.customerSearchBar,
      },
      {
        key: "allocationType",
        button: this.allocationTypeFilter,
        search: this.allocationTypeSearchBar,
      },
      {
        key: "billingType",
        button: this.billingTypeFilter,
        search: this.billingTypeSearchBar,
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

          // Conditionally use exact: true if key is "allocationType"
          const option =
            key === "allocationType"
              ? this.page.getByRole("option", { name: v, exact: true })
              : this.page.getByRole("option", { name: v });

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
   * Select view as either planned or Actual vs Planned based on the parameter
   * @param {string} view - "planned" or "actual_vs_planned"
   */

  async chooseSheetView(view) {
    const currentView = await this.sheetViewFilterText.textContent();

    if (currentView.trim() !== view) {
      // Open the dropdown
      await this.sheetViewFilter.click();

      // Click the correct option based on the view passed
      if (view === "Planned") {
        await this.page.getByRole("option", { name: "Planned", exact: true }).click();
      } else if (view === "Actual vs Planned") {
        await this.page.getByRole("option", { name: "Actual vs Planned" }).click();
      } else {
        throw new Error(`Unknown sheet view: ${view}`);
      }
    }
  }
  async getVisibleWeekRanges() {
    const count = await this.weekRangeSpans.count();
    const ranges = [];
    for (let i = 0; i < count; i++) {
      let val = await this.weekRangeSpans.nth(i).textContent();
      ranges.push(val.trim());
    }
    return ranges;
  }

  async getVisibleDayHeaders() {
    // Collect only those spans that are direct children of th (day/date headers)
    const count = await this.dayHeaderSpans.count();
    const days = [];
    for (let i = 0; i < count; i++) {
      let val = await this.dayHeaderSpans.nth(i).textContent();
      days.push(val.trim());
    }
    return days;
  }
  async verifyEmployeeUnderProject(projectName, employeeName) {
    //Click on project name
    await this.page.getByRole("button", { name: `${projectName}` }).click();
  }
  async waitForOnlyOneElement(locator, timeout = 30000) {
    await expect(locator).toHaveCount(1, { timeout });
  }
}
