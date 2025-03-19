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

    // Column Index Map
    this.dayIndexObj = { member: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7, total: 8, status: 9 };

    // Header Filters
    this.searchInput = page.getByPlaceholder("Employee Name");
    this.reportsToDropdown = page.getByRole("button", { name: "Reports To" });

    // Prev & Next Buttons
    this.prevButton = page.getByRole("button", { name: "prev-week" });
    this.nextButton = page.getByRole("button", { name: "next-week" });

    // Reject Timesheet Modal
    this.rejectTimesheetModal = page.getByRole("dialog").filter({
      has: page.locator("h2", { name: "Reject timesheet" }),
    });

    // Review Timesheet Pane
    this.reviewTimesheetPane = page.getByRole("dialog").filter({
      has: page.locator("h2", { hasText: /^Week of/ }),
      has: page.getByRole("button", { name: "Approve" }),
      has: page.getByRole("button", { name: "Reject" }),
    });

    // Parent Table
    this.parentTable = page.getByRole("table").first();
  }

  // --------------------------------------
  // General
  // --------------------------------------

  /**
   * Navigates to the team page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/team", { waitUntil: "domcontentloaded" });
  }

  /**
   * Performs a search and selection within a modal based on a placeholder text.
   */
  async searchAndSelectOption(placeholder, value) {
    const searchInput = this.page.getByRole("dialog").getByPlaceholder(`${placeholder}`);

    await searchInput.fill(value);
    await this.page.getByRole("option", { name: value }).click();
  }

  // --------------------------------------
  // Top Employee Search
  // --------------------------------------

  /**
   * Searches for an employee in the search input.
   */
  async searchEmployee(name) {
    await this.searchInput.fill(name);
    await this.searchInput.press("ArrowDown+Enter");
  }

  /**
   * Navigates to the employee's timesheet.
   */
  async navigateToEmpTimesheet(name) {
    await this.searchEmployee(name);
    await this.page.locator(`//p[text()='${name}']`).click();
    await this.page.waitForLoadState();
  }

  // --------------------------------------
  // Top Reports To Selection Dropdown
  // --------------------------------------

  /**
   * Applies the 'Reports To' filter by selecting an employee from the dropdown.
   */
  async applyReportsTo(name) {
    await this.reportsToDropdown.click();
    await this.searchAndSelectOption("Search Employee", name);
  }

  // --------------------------------------
  // Prev & Next Buttons
  // --------------------------------------

  /**
   * Clicks on the prev button.
   */
  async viewPreviousWeek() {
    await this.prevButton.click();
  }

  /**
   * Clicks on the next button.
   */
  async viewNextWeek() {
    await this.nextButton.click();
  }

  // --------------------------------------
  // Reject Timesheet Modal
  // --------------------------------------

  /**
   * Rejects the timesheet of a specified employee.
   */
  async rejectTimesheet({ employee, reason }) {
    await this.openReviewTimesheetPane(employee);
    await this.actOnTimeEntry("Reject");
    await this.rejectTimesheetModal.getByPlaceholder("Add a note").fill(reason);
    await this.rejectTimesheetModal.getByRole("button", { name: "Reject" }).click();
  }

  // --------------------------------------
  // Review Timesheet Pane
  // --------------------------------------

  /**
   * Checks if the 'Review Timesheet' pane is visible.
   */
  async isReviewTimesheetPaneVisible() {
    return await this.reviewTimesheetPane.isVisible();
  }

  /**
   * Opens the 'Review Timesheet' pane for a specified employee.
   */
  async openReviewTimesheetPane(employee) {
    const cell = await this.getCell({ employee: employee, rowName: "employee header", col: "status" });
    await cell.click();
  }

  /**
   * Retrieves the time entry section for the specified date.
   */
  async getTimeEntrySection(date) {
    return this.reviewTimesheetPane.locator(`//p[contains(text(),'${date}')]/parent::div/parent::div`);
  }

  /**
   * Retrieves the time entry row for the specified metadata.
   */
  async getTimeEntryRow({ date, project, task, desc }) {
    return this.reviewTimesheetPane.locator(
      `//div[.//p[contains(text(), '${task}')] and .//span[contains(text(), '${project}')] and .//p[contains(text(), '${desc}')] and preceding-sibling::div//p[contains(text(), '${date}')]]`
    );
  }

  /**
   * Toggles time entry selection
   */
  async toggleTimeEntrySelection(date) {
    const section = await this.getTimeEntrySection(date);
    await section.getByRole("checkbox").check();
  }

  /**
   * Updates duration of the specified time entry.
   */
  async updateDurationOfTimeEntry({ date, project, task, desc, newDuration }) {
    const row = await this.getTimeEntryRow({ date: date, project: project, task: task, desc: desc });
    await row.getByRole("textbox").fill(newDuration);
    await row.click();
  }

  /**
   * Performs an action on a time entry by clicking the corresponding button.
   */
  async actOnTimeEntry(action) {
    await this.reviewTimesheetPane.getByRole("button", { name: action }).click();
  }

  // --------------------------------------
  // Parent Table Actions
  // --------------------------------------

  /**
   * Retrieves the header row from the parent table.
   */
  async getHeaderRow() {
    return this.parentTable.locator("thead").getByRole("row");
  }

  /**
   * Retrieves all employee rows from the parent table.
   */
  async getEmployeeRows() {
    await this.parentTable.waitFor({ state: "visible" });

    return this.parentTable.locator("//button[@type='button']");
  }

  /**
   * Retrieves a list of employee names from the parent table.
   */
  async getEmployees() {
    const employees = [];
    const rows = await this.getEmployeeRows();

    for (const row of await rows.all()) {
      const cell = row.getByRole("cell").first();
      const employee = await cell.locator("//p").textContent();
      employees.push(employee);
    }

    return employees;
  }

  /**
   * Checks if the timesheet of the specified employee is visible.
   */
  async isEmployeeTimesheetVisible(name) {
    return this.parentTable
      .locator(`//p[text()='${name}']//ancestor::div[@data-state and @data-orientation='vertical']//table`)
      .isVisible();
  }

  /**
   * Retrieves the timesheet element for a specific employee.
   */
  async getEmployeeTimesheet(name) {
    await this.parentTable.waitFor({ state: "visible" });

    return this.parentTable.locator(
      `//p[text()='${name}']//ancestor::div[@data-state and @data-orientation='vertical']`
    );
  }

  /**
   * Toggles the timesheet view for a specific employee.
   */
  async toggleEmployeeTimesheet(name) {
    const cellInfo = { employee: name, rowName: "employee header", col: "Mon" };
    const cell = await this.getCell(cellInfo);

    await cell.click();
  }

  /**
   * Retrieves the timesheet status of a given employee by analyzing the status icon's class attributes.
   */
  async getTimesheetStatus(name) {
    const cellInfo = { employee: name, rowName: "employee header", col: "status" };
    const cell = await this.getCell(cellInfo);
    const classList = await cell.locator("svg").getAttribute("class");

    if (classList.includes("stroke-success")) {
      return "Approved";
    } else if (classList.includes("stroke-destructive")) {
      return "Rejected";
    } else if (classList.includes("stroke-warning")) {
      return "Approval Pending";
    } else {
      return "Not Submitted";
    }
  }

  /**
   * Retrieves a row from the timesheet based on employee name and row type.
   * Returns header row of the parent table when employee name is not specified.
   */
  async getRow({ employee, rowName }) {
    if (!employee) {
      return this.getHeaderRow();
    }

    const timesheet = await this.getEmployeeTimesheet(employee);
    await timesheet.waitFor({ state: "visible" });

    switch (rowName.toLowerCase()) {
      case "employee header":
        return timesheet.locator("//button[@type='button']");
      case "time off":
        return timesheet.getByRole("row", { name: "Time Off" });
      default:
        return timesheet.getByRole("row", { name: rowName });
    }
  }

  /**
   * Retrieves a specific cell from the timesheet based on employee, row, and column.
   */
  async getCell({ employee, rowName, col }) {
    const row = await this.getRow({ employee: employee, rowName: rowName });
    const colIndex = this.dayIndexObj[col.toLowerCase()];
    const cell = row.getByRole("cell").nth(colIndex);

    await cell.waitFor({ state: "visible" });
    return cell;
  }

  /**
   * Retrieves the text content of a specified cell.
   */
  async getCellText(cellInfo) {
    const cell = await this.getCell(cellInfo);

    return (await cell.isVisible()) ? await cell.textContent() : "-";
  }

  /**
   * Retrieves the tooltip text of a specified cell.
   */
  async getCellTooltipText(cellInfo) {
    const cell = await this.getCell(cellInfo);
    const tooltip = cell.locator("//div[@data-radix-popper-content-wrapper]");

    await cell.hover();
    await tooltip.waitFor({ state: "visible" });

    return (await tooltip.isVisible()) ? await tooltip.textContent() : "";
  }

  /**
   * Retrieves the date of a specific parent table column.
   */
  async getColDate(col) {
    const cell = await this.getCell({ rowName: "header", col: col });
    const date = cell.locator("//span");

    return (await cell.isVisible()) ? await date.textContent() : "-";
  }

  // --------------------------------------
  // Task Details Dialog
  // --------------------------------------

  /**
   * Opens the details dialog of a specified task.
   */
  async openTaskDetails({ employee, task }) {
    const timesheet = await this.getEmployeeTimesheet(employee);
    const element = timesheet.locator(`//span[text()='${task}']`);
    await element.click();
  }

  /**
   * Checks if the task details dialog with the specified name is visible.
   */
  async isTaskDetailsDialogVisible(name) {
    return this.page.getByRole("dialog", { name: name }).isVisible();
  }
}
