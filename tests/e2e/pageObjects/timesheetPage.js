import { expect } from "@playwright/test";

/**
 * TimesheetPage class handles interactions with the timesheet page.
 */
export class TimesheetPage {
  /**
   * Initializes the TeamPage object.
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // Column Index Map
    this.dayIndexObj = { task: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7, total: 8 };

    // Header Buttons
    this.employeeButton = page.locator("//header//button[@aria-haspopup='dialog']");
    this.leaveButton = page.getByRole("button", { name: "Leave" });
    this.timeButton = page.getByRole("button", { name: "Time" });

    // Modals
    this.addLeaveModal = page.getByRole("dialog", { name: "Add Leave" });
    this.addTimeModal = page.getByRole("dialog", { name: "Add Time" });
    this.editTimeModal = page.getByRole("dialog", { name: "Edit Time" });
    this.submitTimesheetModal = page.getByRole("dialog").filter({
      has: page.locator("h2", { hasText: /^Week of/ }),
      has: page.getByRole("button", { name: "Submit For Approval" }),
    });

    this.addHours = (timeEntryCount) => page.locator(`//input[@name="${timeEntryCount}"]`);

    this.updateDescription = (timeSheetDescription) =>
      page.locator(
        `//p[contains(text(),"${timeSheetDescription}")]//parent::div[@data-placeholder="Update your progress"]`
      );
    this.insertDescription = page.locator('div.ql-editor.ql-blank[data-placeholder="Update your progress"]');

    // Review Timesheet Pane (Not a part of this page)
    this.reviewTimesheetPane = page.getByRole("dialog").filter({
      has: page.locator("h2", { hasText: /^Week of/ }),
      has: page.getByRole("button", { name: "Approve" }),
      has: page.getByRole("button", { name: "Reject" }),
    });

    // Latest Timesheet Elements
    this.latestTimesheetDiv = page.locator("//div[@data-orientation='vertical']").first();
    this.latestTimesheetTitleDiv = this.latestTimesheetDiv.locator("//button[@data-orientation='vertical']");
    this.latestTimesheetTable = this.latestTimesheetDiv.getByRole("table");

    //Success Banner : Deleted Time Entry
    this.successBanner = page.locator(`//div[text()="Time entry deleted successfully."]`);

    //Timesheet Description
    this.descriptionNewEntry = page.locator(`//div[@data-placeholder = "Explain your progress"]`);
  }

  // --------------------------------------
  // General
  // --------------------------------------

  /**
   * Navigates to the timesheet page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/timesheet", { waitUntil: "domcontentloaded" });
  }

  /**
   * Checks if the timesheet page is visible.
   */
  async isPageVisible() {
    return await this.timeButton.isVisible();
  }

  /**
   * Performs a search and selection within a modal based on a placeholder text.
   */
  async searchAndSelectOption(placeholder, value) {
    const searchButton = this.page.getByRole("button", { name: placeholder });
    const searchInput = this.page.getByRole("dialog").getByPlaceholder(`${placeholder}`);

    await searchButton.click();
    await searchInput.fill(value);
    await this.page.waitForTimeout(2000);
    await searchInput.press("ArrowDown+Enter");
  }

  /**
   * Adds a time entry to the timesheet by filling in the required fields.
   * Optional params: project, task.
   */
  async AddTime({ duration, project, task, desc }) {
    await this.addTimeModal.getByPlaceholder("00:00").fill(duration);
    if (project) {
      await this.searchAndSelectOption("Search Projects", project);
    }
    if (task) {
      await this.searchAndSelectOption("Search Task", task);
    }
    await this.descriptionNewEntry.fill(desc);
    await this.addTimeModal.getByRole("button", { name: "Add Time" }).click();
  }

  // --------------------------------------
  // Top Employee Selection Dropdown
  // --------------------------------------

  /**
   * Retrieves the name of the currently displayed employee's timesheet.
   */
  async getSelectedEmployee() {
    const selectedEmployee = this.employeeButton.getByRole("paragraph");

    await selectedEmployee.waitFor({ state: "visible" });

    return await selectedEmployee.textContent();
  }

  /**
   * Selects an employee and displays their timesheet.
   */
  async selectEmployee(name) {
    const searchInput = this.page.getByRole("dialog").getByPlaceholder("Search Employee");

    await this.employeeButton.click();
    await searchInput.fill(name);
    await this.page.getByRole("option", { name: name }).click();
    await this.page.waitForLoadState();
  }

  // --------------------------------------
  // Top Add Leave Button
  // --------------------------------------

  /**
   * Applies for leave by selecting the leave type and providing a reason.
   * The selected leave type is 'Unpaid Time Off'.
   */
  async applyForLeave(reason) {
    await this.leaveButton.click();
    await this.searchAndSelectOption("Search Leave Type", "Unpaid Time Off");
    await this.addLeaveModal.getByPlaceholder("Reason for leave").fill(reason);
    await this.page.waitForTimeout(2000);
    await this.addLeaveModal.getByRole("button", { name: "Add Leave" }).click();
  }

  // --------------------------------------
  // Top Add Time Button
  // --------------------------------------

  /**
   * Adds a time entry by interacting with the "Time" button.
   */
  async addTimeViaTimeButton(taskInfo) {
    await this.timeButton.click();
    await this.AddTime(taskInfo);
  }

  // --------------------------------------
  // Timesheet Submission Actions
  // --------------------------------------

  /**
   * Retrives the timesheet status.
   */
  async getTimesheetStatus() {
    const button = this.latestTimesheetTitleDiv.locator("span").last();

    await button.waitFor({ state: "visible" });

    return await button.textContent();
  }

  /**
   * Clicks on timesheet status to open 'Submit For Approval' modal.
   */
  async clickonTimesheetStatus() {
    const button = this.latestTimesheetTitleDiv.locator("span").last();

    await button.waitFor({ state: "visible", timeout: 30000 });
    await button.click();
  }

  /**
   * Checks if the 'Submit For Approval' modal is visible.
   */
  async isSubmitForApprovalModalVisible() {
    return await this.submitTimesheetModal.isVisible();
  }

  /**
   * Submits the timesheet.
   */
  async submitTimesheet() {
    await this.clickonTimesheetStatus();
    await this.submitTimesheetModal.getByRole("button", { name: "Submit For Approval" }).click();
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

  // --------------------------------------
  // Latest Timesheet Actions
  // --------------------------------------

  /**
   * Retrieves all rows of the timesheet table.
   */
  async getRows() {
    await this.latestTimesheetTable.waitFor({ state: "visible" });

    return this.latestTimesheetTable.getByRole("row");
  }

  /**
   * Retrieves a specific row in the timesheet table based on the provided row name.
   * Handles predefined row types like header, duration, time off, and new entry as well as dynamic row names.
   */
  async getRow(rowName) {
    await this.latestTimesheetTable.waitFor({ state: "visible" });

    switch (rowName.toLowerCase()) {
      case "header":
        return this.latestTimesheetTable.locator("thead").getByRole("row");
      case "duration":
        return this.latestTimesheetTable.locator("tbody").getByRole("row").first();
      case "time off":
        return this.latestTimesheetTable.getByRole("row", { name: "Time Off" });
      case "new entry":
        return this.latestTimesheetTable.locator("//tr[not(contains(@class, 'border-slate'))]").last();
      default:
        return this.latestTimesheetTable.getByRole("row", { name: rowName });
    }
  }

  /**
   * Checks if the "Time Off" row is present in the timesheet table.
   */
  async isTimeOffRowPresent() {
    const rows = await this.getRows();

    // Iterate through all rows to check for "Time Off" in the first cell
    for (const row of await rows.all()) {
      const cellText = await row.getByRole("cell").first().textContent();
      if (cellText === "Time Off") return true;
    }

    return false;
  }

  /**
   * Retrieves the task rows from the timesheet table, excluding header rows.
   */
  async getTaskRows() {
    const rows = await this.getRows();
    const isTimeOffRowPresent = await this.isTimeOffRowPresent();
    const rowsToSkip = isTimeOffRowPresent ? 4 : 3;

    // Remove header rows
    for (let i = 0; i < rowsToSkip; i++) {
      await rows.nth(0).evaluate((el) => el.remove());
    }

    return rows;
  }

  /**
   * Retrieves a list of timesheet task names from the table.
   */
  async getTimesheetTasks() {
    const tasks = [];
    const rows = await this.getTaskRows();

    // Iterate through each row to extract the task name from the first cell
    for (const row of await rows.all()) {
      const cell = row.getByRole("cell").first();
      const task = await cell.locator("//span[@class='truncate']").textContent();
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Retrieves a random task name from the timesheet tasks.
   */
  async getRandomTimesheetTask() {
    const tasks = await this.getTimesheetTasks();
    const index = Math.floor(Math.random() * tasks.length); // Generate a random index

    return tasks[index];
  }

  /**
   * Retrieves a specific cell from the timesheet table based on the row and column name.
   */
  async getCell({ rowName, col }) {
    const row = await this.getRow(rowName);
    const colIndex = this.dayIndexObj[col.toLowerCase()];
    const cell = row.getByRole("cell").nth(colIndex);
    await cell.waitFor({ state: "visible", timeout: 15000 });

    return cell;
  }

  /**
   * Retrieves the text content from a specific timesheet cell.
   */
  async getCellText(cellInfo) {
    const cell = await this.getCell(cellInfo);

    return (await cell.isVisible()) ? await cell.textContent() : "-";
  }

  /**
   * Retrieves the tooltip text from a specific timesheet cell.
   */
  async getCellTooltipText(cellInfo) {
    const cell = await this.getCell(cellInfo);
    const tooltip = cell.locator("//div[@data-radix-popper-content-wrapper]");

    await cell.hover();
    await tooltip.waitFor({ state: "visible" });

    return (await tooltip.isVisible()) ? await tooltip.textContent() : "";
  }

  /**
   * Checks if a time entry is billable by counting the number of SVG elements in the cell.
   */
  async isTimeEntryBillable(cellInfo) {
    const cell = await this.getCell(cellInfo);
    const svgList = cell.locator("svg");

    return (await svgList.count()) >= 3;
  }

  /**
   * Retrieves the date of a specific timesheet column.
   */
  async getColDate(col) {
    const cell = await this.getCell({ rowName: "header", col: col });
    const date = cell.locator("//span");

    return (await cell.isVisible()) ? await date.textContent() : "-";
  }

  /**
   * Opens a cell for dialog interaction.
   */
  async openCell(cell) {
    await cell.waitFor({ state: "visible" });
    await cell.click();
  }

  /**
   * Adds a time entry by interacting with the timesheet cell.
   */
  async addTimeViaCell(cellInfo, taskInfo) {
    const cell = await this.getCell(cellInfo);

    await this.openCell(cell);
    await this.AddTime(taskInfo);
  }

  /**
   * Adds a new time row to an existing time entry by interacting with the timesheet cell.
   */
  async addTimeRow(cellInfo, { duration, desc }) {
    const cell = await this.getCell(cellInfo);

    await this.openCell(cell);
    await this.editTimeModal.getByRole("button", { name: "Add Row" }).click();
    // data.0.hours = first time entry for a task, data.1.hours = second time entry for a task in the modal.
    await this.addHours("data.1.hours").fill(duration);

    await this.insertDescription.fill(desc);
    await this.editTimeModal.getByRole("button", { name: "Save" }).click();
  }

  /**
   * Updates an existing time entry by interacting with the timesheet cell.
   */
  async updateTimeRow(cellInfo, { desc, newDesc, newDuration }) {
    const cell = await this.getCell(cellInfo);
    // Strip HTML tags from newDesc.
    const plainTextDesc = desc.replace(/<[^>]*>?/gm, "");

    await this.openCell(cell);
    await this.addHours("data.0.hours").fill(newDuration);
    await this.updateDescription(plainTextDesc).fill(newDesc);
    await this.editTimeModal.getByRole("button", { name: "Save" }).click();
    await this.editTimeModal.getByRole("button", { name: "Close" }).click();
  }

  /**
   * Deletes an existing time entry by interacting with the timesheet cell.
   */
  async deleteTimeRow(cellInfo, { desc }) {
    const cell = await this.getCell(cellInfo);
    const row = this.editTimeModal.locator(
      `//p[contains(text(), '${desc}')]/ancestor::div[contains(@class, 'items-start')]`
    );

    await this.openCell(cell);
    await row.locator("//button[contains(@class,'bg-destructive')]").first().click();
    //Assert : Banner to be displayed when a time entry is deleted
    await expect(this.successBanner).toBeVisible();
    await this.editTimeModal.getByRole("button", { name: "Close" }).click();
  }

  // --------------------------------------
  // Import Liked Tasks
  // --------------------------------------

  /**
   * Imports liked tasks into the timesheet by clicking the import button.
   */
  async importLikedTasks() {
    const button = this.latestTimesheetTable.locator("//span[@title='Import liked tasks']");
    await this.page.waitForTimeout(2000);
    await button.waitFor({ state: "visible", timeout: 30000 });
    await button.click();
  }

  // --------------------------------------
  // Task Details Dialog
  // --------------------------------------

  /**
   * Opens the details dialog of a specified task.
   */
  async openTaskDetails(task) {
    const taskSpan = this.latestTimesheetTable.locator(`//span[@class='truncate' and text()='${task}']`);

    await taskSpan.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Selects a random task from the timesheet and opens its details dialog.
   */
  async openRandomTaskDetails() {
    const randomTask = await this.getRandomTimesheetTask();

    await this.openTaskDetails(randomTask);

    return randomTask;
  }

  /**
   * Checks if the task details dialog with the specified name is visible.
   */
  async isTaskDetailsDialogVisible(name) {
    return this.page.getByRole("dialog", { name: name }).isVisible();
  }
}
