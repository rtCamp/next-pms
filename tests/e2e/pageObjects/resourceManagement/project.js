/**
 * Represents the Project page in the resource management section.
 * Extends the TimelinePage and provides methods for navigating to and verifying the project page.
 */
import { expect } from "@playwright/test";
import { TimelinePage } from "./timeline";
import { getShortFormattedDate, getWeekdayName } from "../../utils/dateUtils";
// Filter keys mapped to the labels the panel's "Field" dropdown offers.
const RM_FILTER_FIELD_LABELS = {
  customer: "Customer",
  billingType: "Billing Type",
  projectType: "Project Type",
  projectManager: "Project Manager",
  tag: "Tag",
};

const rmExactly = (text) => new RegExp(`^${String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

// "Allocation type" is its own combobox, outside the query-builder, and its
// options are worded differently from the values the tests pass in.
const ALLOCATION_TYPE_OPTIONS = {
  Billable: "Billable only",
  "Non-Billable": "Non-billable only",
  Confirmed: "Confirmed only",
  Tentative: "Tentative only",
};

export class ProjectPage extends TimelinePage {
  constructor(page) {
    super(page);
    this.filterByProjectInput = page.getByRole("textbox", { name: "Search project" });

    //Search bar on project page
    this.searchBar = page.getByRole("textbox", { name: "Search project" });

    // Filter panel - a query-builder: "Where <Field> <Operator> <Value>"
    this.filterButton = page.getByRole("button", { name: "Filter" }).first();
    this.clearAllFiltersButton = page.getByRole("button", { name: "Clear all filters" });
    this.addFilterButton = page.getByText("Add filter");
    this.filterFieldInput = page.getByPlaceholder("Field");
    this.filterOperatorInput = page.getByPlaceholder("Operator");
    this.filterValueInput = page.getByPlaceholder("Value");
    // Period and allocation-type selectors sit outside the filter panel.
    this.periodFilter = page.getByRole("combobox").first();
    this.allocationTypeFilter = page.getByRole("combobox").last();
    this.sheetViewFilter = page.getByRole("combobox");
    this.sheetViewFilterText = this.sheetViewFilter.locator("span");

    //Combined Week hours
    this.combineWeekHoursCheckbox = page.locator("#combineWeekHours");

    //Search bar inside filter dropdown
    this.customerSearchBar = page.getByPlaceholder("Customer");
    this.billingTypeSearchBar = page.getByPlaceholder("Billing Type");
    this.allocationTypeSearchBar = page.getByPlaceholder("Allocation Type");

    //Filter Clear Selection
    this.filterClearSelection = page.getByRole("button", { name: "Clear Selection" });

    //table elements - names render as buttons ("View <name> details"), not title attributes
    this.projectNameCell = (projectName) =>
      page.getByRole("button", { name: `View ${projectName} details`, exact: true }).first();
    this.employeeNameCell = (employeeName) => page.getByRole("table").getByText(employeeName, { exact: true }).first();
    this.projectTableTitle = page.getByRole("cell", { name: "Projects" });
    this.deleteButton = page.getByRole("img", { name: "Delete" }).first();
    this.editIcon = page.getByRole("img", { name: "Edit" }).first();
    this.clipboardIcon = page.getByRole("img", { name: "Copy" }).first();

    // One "View <name> details" button per project row.
    this.projectListItems = page.getByRole("table").getByRole("button", { name: /^View .* details$/ });

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
    await this.page.goto("/next-pms/allocations/project", { waitUntil: "domcontentloaded" });
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
    //wait until filterByProjectInput is visible
    await this.filterByProjectInput.waitFor({ state: "visible" });
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

    // The grid's day cells are gone: the body now renders one week-wide cell per
    // column inside a quarter view, and an empty cell is not clickable. The
    // allocation dialog is the surviving entry point, and it takes the target
    // date through its own "Start and end date" picker.
    const allocationName = await this.addAllocation(projectName, customerName, employeeName, date, allocation);

    return { allocationName };
  }

  /**
   * Delete the allocation added.
   */
  async deleteAllocationFromProjectTab(projectName, date, day) {
    await this.deleteAllocation(projectName);
  }

  /**
   * Click on the clipboard icon on hover
   */
  async clickClipboardIcon(projectName, date, day) {
    // The redesigned allocation popover exposes only "Edit allocation" and
    // "Delete allocation" - there is no copy/duplicate control anywhere in the
    // grid, so this workflow has no counterpart to drive yet.
    throw new Error(
      "clickClipboardIcon: the allocation grid no longer exposes a copy/clipboard control " +
        '(the chip popover offers only "Edit allocation" and "Delete allocation").',
    );
  }

  /**
   * Click on the edit icon on hover
   */
  async clickEditIcon(projectName, date, day) {
    // Allocations are chips in the grid; their popover carries the edit action.
    await this.openEditAllocationDialog();
  }

  /**
   * Add a allocated time on a add allocation modal
   */
  async addAllocationFromProjectTabFromClipboard(hoursPerDay, totalAllocatedHours = "100") {
    // Same guard as editAllocationFromProjectTab: "Total hours" is derived and
    // ships disabled, so an awaited fill() would block until the test times
    // out. These two were also missing their await, which hid that.
    if (await this.totalHoursTextField.isEditable().catch(() => false)) {
      await this.totalHoursTextField.fill("");
      await this.totalHoursTextField.fill(totalAllocatedHours);
    }
    await this.setHoursPerDay(hoursPerDay);
    // Wait for the allocation API response and click the create button in parallel
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/method/next_pms.resource_management.api.allocation.handle_allocation") &&
          response.status() === 200,
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
    // "Total hours" is now derived from hours/day x the date range and ships
    // disabled, so filling it would block until the test times out. Only write
    // it on the chance a future build makes it editable again.
    if (await this.totalHoursTextField.isEditable().catch(() => false)) {
      await this.totalHoursTextField.fill("");
      await this.totalHoursTextField.fill(totalAllocatedHours);
    }
    await this.setHoursPerDay(hoursPerDay);
  }

  /**
   * Get an allocation time from Project page using project name and allocation date
   */
  async getAllocationFromProjectTab(projectName, date, day) {
    await this.page.waitForTimeout(1000);

    // Chips summarise the allocation as e.g. "8h / day" or "32h / week"; callers
    // compare against the hours-per-day figure they set.
    const chipText = await this.allocationChip.first().textContent();
    const hours = chipText?.match(/([\d.]+)\s*h/i);

    return hours ? hours[1] : chipText?.trim();
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
      const label = await this.projectListItems.nth(i).textContent();
      titles.push(label.trim());
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
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}); // Wait for the search results to load
  }
  /**
   * Clears specified filter dropdowns by clicking on each and selecting 'Clear Selection'
   * If no filters are specified, all filters will be cleared.
   * @param {Array<string>} filtersToClear - Array of filter names like ['projectType', 'currency']
   */
  async clearFilters() {
    // The panel only offers "Clear all filters" - filters can no longer be
    // cleared one at a time, so any argument is ignored.
    if (await this.clearAllFiltersButton.isVisible().catch(() => false)) {
      await this.clearAllFiltersButton.click();
      await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    }
  }

  /**
   * Apply all filters provided through the panel's query-builder.
   * Conditions are ANDed - the panel has no OR and no multi-value operator.
   * @param {Object} filters - e.g. { customer, billingType, projectType, projectManager, tag }
   */
  async applyFilters(filters) {
    let hasCondition = false;

    for (const [key, rawValue] of Object.entries(filters)) {
      if (!rawValue) continue;
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      if (values.length === 0) continue;

      // Allocation type lives in its own combobox, not the query-builder.
      if (key === "allocationType") {
        const optionLabel = ALLOCATION_TYPE_OPTIONS[values[0]] ?? values[0];
        await this.allocationTypeFilter.click();
        await this.page
          .getByRole("option", { name: rmExactly(optionLabel) })
          .first()
          .click();
        await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
        continue;
      }

      const fieldLabel = RM_FILTER_FIELD_LABELS[key];
      if (!fieldLabel) {
        throw new Error(
          `Filter "${key}" is not selectable in the allocations filter panel. ` +
            `Available: ${Object.keys(RM_FILTER_FIELD_LABELS).join(", ")}.`,
        );
      }

      for (const value of values) {
        await this.addFilterCondition(fieldLabel, value, hasCondition);
        hasCondition = true;
      }
    }
  }

  /**
   * Adds a single "<Field> Equals <Value>" condition to the filter panel.
   */
  async addFilterCondition(fieldLabel, value, needsNewRow) {
    if (
      !(await this.filterFieldInput
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await this.filterButton.click();
    }
    if (needsNewRow) {
      await this.addFilterButton.click();
    }

    const field = this.filterFieldInput.last();
    await field.click();
    await field.fill(fieldLabel);
    await this.page
      .getByRole("option", { name: rmExactly(fieldLabel) })
      .first()
      .click();

    const operator = this.filterOperatorInput.last();
    await operator.click();
    await this.page
      .getByRole("option", { name: rmExactly("Equals") })
      .first()
      .click();

    const valueInput = this.filterValueInput.last();
    await valueInput.click();
    // Link fields (e.g. Customer) only load their options once typed into.
    await valueInput.fill(value).catch(() => {});
    await this.page.waitForTimeout(800);

    const option = this.page.getByRole("option", { name: rmExactly(value) }).first();
    await option.waitFor({ state: "visible", timeout: 10000 });
    await option.click();

    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
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
  /**
   * Expands a project row to reveal the employees allocated to it. The row's
   * name opens project details; the separate Expand control reveals the list.
   */
  async expandProjectRow(projectName) {
    // "Expand" sits as a sibling just before the project's name button, so
    // anchor on the name and step back to it rather than relying on row roles.
    const nameButton = this.page.getByRole("button", { name: `View ${projectName} details`, exact: true }).first();
    await nameButton.waitFor({ state: "visible", timeout: 15000 });

    const expand = nameButton.locator("xpath=preceding-sibling::button[1]").first();
    // A full-size transparent button ("absolute inset-0 z-10") covers the row
    // and swallows the pointer event, so a normal click never reaches the
    // chevron. Dispatching the event hits the chevron directly, and unlike
    // click({force:true}) it does not also fire the overlay's own handler.
    await expand.dispatchEvent("click");
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  async verifyEmployeeUnderProject(projectName) {
    //Click on project name
    await this.page.getByRole("button", { name: `${projectName}` }).click();
  }
  async waitForOnlyOneElement(locator, timeout = 30000) {
    await expect(locator).toHaveCount(1, { timeout });
  }
}
