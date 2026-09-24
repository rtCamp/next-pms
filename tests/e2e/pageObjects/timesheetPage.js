import { expect } from "@playwright/test";
import { gotoWithRetry } from "../utils/navigation.js";

/**
 * TimesheetPage class handles interactions with the timesheet page.
 */
/**
 * Removes all HTML tags from a string by repeatedly applying the regex until no tags remain.
 * @param {string} input
 * @returns {string}
 */
export function removeHtmlTags(input) {
  let previous;
  do {
    previous = input;
    input = input.replace(/<[^>]*>?/gm, "");
  } while (input !== previous);
  return input;
}

export class TimesheetPage {
  /**
   * Initializes the TeamPage object.
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // Column Index Map
    this.dayIndexObj = {
      task: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
      sun: 7,
      total: 8,
    };

    // Header Buttons
    this.employeeButton = page.locator(
      "//header//button[@aria-haspopup='dialog']",
    );
    this.leaveButton = page.getByRole("button", {
      name: "Add time-off",
      exact: true,
    });
    // Scoped to the page header: "Add time" also names all ~100 day cells.
    this.timeButton = page
      .getByRole("banner")
      .getByRole("button", { name: "Add time", exact: true });

    // Modals
    // The dialog exposes no accessible name; only one is open at a time.
    this.addLeaveModal = page.getByRole("dialog");
    // Time entry happens in two surfaces, both exposed as a single dialog: the
    // header "Add time" modal (project + task + duration) and the popover that
    // opens from a timesheet cell (duration + comment only).
    this.addTimeModal = page.getByRole("dialog");
    this.editTimeModal = page.getByRole("dialog");
    this.submitTimesheetModal = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: "Submit for approval" }),
    });

    this.addHours = (timeEntryCount) =>
      page.locator(`//input[@name="${timeEntryCount}"]`);

    this.updateDescription = (timeSheetDescription) =>
      page.locator(
        `//p[contains(text(),"${timeSheetDescription}")]//parent::div[@data-placeholder="Update your progress"]`,
      );
    this.insertDescription = page.locator(
      'div.ql-editor.ql-blank[data-placeholder="Update your progress"]',
    );

    // Review Timesheet Pane (Not a part of this page)
    this.reviewTimesheetPane = page.getByRole("dialog").filter({
      has: page.locator("h2", { hasText: /^Week of/ }),
      has: page.getByRole("button", { name: "Approve" }),
      has: page.getByRole("button", { name: "Reject" }),
    });

    // Latest Timesheet Elements
    this.latestTimesheetDiv = page
      .locator("//div[@data-orientation='vertical']")
      .first();
    // The timesheet grid has no table semantics. Every line is a row div whose
    // indentation class encodes its level: week header (pl-3), weekly totals /
    // project / time-off (pl-7.5) and task (pl-13.5).
    this.latestTimesheetRows = this.latestTimesheetDiv.locator(
      "div.border-b.transition-colors",
    );
    this.latestTimesheetHeaderRow = this.latestTimesheetRows.first();
    this.latestTimesheetTaskRows = this.latestTimesheetDiv.locator(
      'div.border-b.transition-colors[class*="pl-13.5"]',
    );
    this.timesheetStatusBadge = this.latestTimesheetHeaderRow
      .locator("div.rounded-full")
      .first();
    this.submitForApprovalButton = this.latestTimesheetHeaderRow.getByRole(
      "button",
      {
        name: "Submit for approval",
      },
    );

    //Success Banner : Deleted Time Entry
    // Toasts render inside the notifications region with the message split
    // across nested elements, so an exact-text-node match never resolves.
    this.successBanner = page
      .getByRole("region", { name: /notification/i })
      .getByText("Time entry deleted successfully");

    //Toast Notification
    // Toasts render inside the notifications region, with the message split
    // across nested elements - match on text rather than an exact-text node.
    this.toastNotification = (notificationMessage) =>
      page
        .getByRole("region", { name: /notification/i })
        .getByText(notificationMessage);

    //Timesheet Description
    this.descriptionNewEntry = page.locator(
      `//div[@data-placeholder = "Explain your progress"]`,
    );
  }

  // --------------------------------------
  // General
  // --------------------------------------

  /**
   * Navigates to the timesheet page and waits for it to fully load.
   */
  async goto() {
    await gotoWithRetry(this.page, "/next-pms/timesheet");
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
    const searchInput = this.page
      .getByRole("dialog")
      .getByPlaceholder(`${placeholder}`);

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
      await this.selectComboboxOption("Select project", project);
    }
    if (task) {
      await this.selectComboboxOption("Select task", task);
    }
    if (desc) {
      await this.addTimeModal.locator("[contenteditable]").first().fill(desc);
    }
    // the cell popover saves with "Save entry", the header modal with "Save and close"
    await this.addTimeModal
      .getByRole("button", { name: /^(Save entry|Save and close)$/ })
      .first()
      .click();
  }

  /**
   * Picks a value from one of the dialog's comboboxes by its placeholder.
   */
  async selectComboboxOption(placeholder, value) {
    const input = this.addTimeModal.getByPlaceholder(placeholder);

    await input.click();
    await input.fill(value);
    await this.page.waitForTimeout(1000);
    await this.page.getByRole("option", { name: value }).first().click();
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
    const searchInput = this.page
      .getByRole("dialog")
      .getByPlaceholder("Search Employee");

    await this.employeeButton.click();
    await searchInput.fill(name);
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});

    await this.page.getByRole("option", { name: name }).click();
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
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

    // The dialog is now: leave-type combobox, start/end dates (defaulting to
    // today), a Full/First/Second Half choice and a reason textarea.
    const dialog = this.addLeaveModal;
    await dialog.getByRole("combobox").first().click();
    await this.page
      .getByRole("option", { name: "Unpaid Time Off" })
      .first()
      .click();
    await this.page.waitForTimeout(500);

    await dialog.locator("textarea").first().fill(reason);
    await this.page.waitForTimeout(500);
    await dialog
      .getByRole("button", { name: "Add time-off", exact: true })
      .click();
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
    await this.timesheetStatusBadge.waitFor({ state: "visible" });

    return await this.timesheetStatusBadge.textContent();
  }

  /**
   * Clicks on timesheet status to open 'Submit For Approval' modal.
   */
  async clickonTimesheetStatus() {
    await this.submitForApprovalButton.waitFor({
      state: "visible",
      timeout: 30000,
    });
    await this.submitForApprovalButton.click();
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
    await this.submitTimesheetModal
      .getByRole("button", { name: "Submit", exact: true })
      .click();
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
    await this.latestTimesheetRows.first().waitFor({ state: "visible" });

    return this.latestTimesheetRows;
  }

  /**
   * Retrieves a specific row in the timesheet table based on the provided row name.
   * Handles predefined row types like header, duration, time off, and new entry as well as dynamic row names.
   */
  async getRow(rowName) {
    await this.latestTimesheetRows.first().waitFor({ state: "visible" });

    switch (rowName.toLowerCase()) {
      case "header":
        return this.latestTimesheetHeaderRow;
      case "duration":
        // the weekly totals line, rendered directly under the week header
        return this.latestTimesheetRows.nth(1);
      case "time off":
        return this.latestTimesheetRows.filter({ hasText: "Time-off" }).last();
      case "new entry":
        return this.latestTimesheetTaskRows.last();
      default:
        return this.latestTimesheetRows.filter({ hasText: rowName }).last();
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
    await this.latestTimesheetRows.first().waitFor({ state: "visible" });

    return this.latestTimesheetTaskRows;
  }

  /**
   * Retrieves a list of timesheet task names from the table.
   */
  async getTimesheetTasks() {
    const tasks = [];
    const rows = await this.getTaskRows();

    // Iterate through each row to extract the task name from the first cell
    for (const row of await rows.all()) {
      const task = await row.locator("span.truncate").first().textContent();
      tasks.push(task.trim());
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
    // row children are: label, Mon..Sun, Total (matching dayIndexObj)
    const cell = row.locator("> div").nth(colIndex);
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

    // Entry details are no longer a hover tooltip - the cell opens a popover
    // listing that day's entries with their descriptions.
    await this.openCell(cell);
    const popover = this.page.getByRole("dialog").first();
    await popover.waitFor({ state: "visible", timeout: 15000 });

    return await popover.innerText();
  }

  /**
   * Checks if a time entry is billable by counting the number of SVG elements in the cell.
   */
  async isTimeEntryBillable(cellInfo) {
    const cell = await this.getCell(cellInfo);
    // Only non-billable entries are flagged, with an amber dot under the hours.
    const nonBillableDot = cell.locator("span.bg-surface-amber-3");

    return (await nonBillableDot.count()) === 0;
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

    // The cell popover lists the day's entries; "Add time" appends another one.
    await this.editTimeModal.getByRole("button", { name: "Add time" }).click();
    await this.editTimeModal.getByPlaceholder("00:00").fill(duration);

    if (desc) {
      await this.editTimeModal.locator("[contenteditable]").last().fill(desc);
    }
    await this.editTimeModal
      .getByRole("button", { name: "Save entry" })
      .click();
  }

  /**
   * Updates an existing time entry by interacting with the timesheet cell.
   */
  async updateTimeRow(cellInfo, { desc, newDesc, newDuration }) {
    const cell = await this.getCell(cellInfo);
    // Strip HTML tags from desc.
    const plainTextDesc = removeHtmlTags(desc);

    await this.openCell(cell);

    // Each entry in the popover carries an icon-only button that opens it for
    // editing; the entry is identified by the description it already holds.
    const entry = this.editTimeModal.filter({ hasText: plainTextDesc }).first();
    await entry.getByRole("button").filter({ hasText: /^$/ }).first().click();

    // The duration field is a masked time input backed by a hidden minutes
    // field, and it only commits the typed value to component state on blur -
    // without it the display shows the new value while the save posts the old
    // one. Same trap as the review pane's inline edit.
    const duration = this.editTimeModal.getByPlaceholder("00:00");
    await duration.fill(newDuration);
    await duration.blur();
    await this.page.waitForTimeout(500);

    await this.editTimeModal.locator("[contenteditable]").first().fill(newDesc);
    await this.editTimeModal
      .getByRole("button", { name: "Save entry" })
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Deletes an existing time entry by interacting with the timesheet cell.
   */
  async deleteTimeRow(cellInfo, { desc }) {
    const cell = await this.getCell(cellInfo);

    await this.openCell(cell);

    // The dialog lists each entry as a header button (the duration) followed by
    // a region holding the description. Neither of the old anchors survives:
    // there is no "items-start" ancestor, and no "bg-destructive" button
    // anywhere in the timesheet dialog (that class is only used by
    // taskStatusIndicator now). Find the entry by its description, then step
    // back to its header, whose nested icon button is the delete.
    const region = this.editTimeModal
      .getByRole("region")
      .filter({ hasText: desc })
      .first();
    await region.waitFor({ state: "visible", timeout: 15000 });

    // The delete control is an unlabelled icon button that only exists visually
    // on hover: "absolute right-0 top-0 opacity-0 pointer-events-none
    // group-hover:opacity-100". It is not a preceding sibling of the panel, so
    // go up to the accordion item that holds both and hover that first.
    const item = region.locator("xpath=..");
    await item.hover();
    await this.page.waitForTimeout(500);

    // That hover control opens the entry's edit form; deleting is a named
    // button inside it. Two steps, not one - the old single-click assumption is
    // why this looked unfixable.
    const editButton = item
      .locator('button[class*="absolute"][class*="right-0"]')
      .first();
    await editButton.waitFor({ state: "visible", timeout: 10000 });
    await editButton.click();

    const deleteButton = this.editTimeModal.getByRole("button", {
      name: "Delete entry",
    });
    await deleteButton.waitFor({ state: "visible", timeout: 15000 });
    await deleteButton.click();
    //Assert : Banner to be displayed when a time entry is deleted
    await expect(this.successBanner).toBeVisible();

    // The dialog closes itself once the entry is gone, and there is no "Close"
    // button left to click - waiting for one hung the test for the full timeout
    // after the delete had already succeeded.
    if (await this.editTimeModal.isVisible().catch(() => false)) {
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(500);
    }
  }

  // --------------------------------------
  // Import Liked Tasks
  // --------------------------------------

  /**
   * Imports liked tasks into the timesheet by clicking the import button.
   */
  async importLikedTasks() {
    const button = this.page
      .getByRole("button", { name: "Import liked tasks to this week" })
      .first();
    const firstRow = this.latestTimesheetTaskRows.first();

    await button.waitFor({ state: "visible", timeout: 30000 }).catch(() => {});

    // The control is gone once the week already holds the liked tasks, so an
    // absent button is only fine when rows are actually there.
    if (!(await button.isVisible().catch(() => false))) {
      if (await firstRow.isVisible().catch(() => false)) return;

      throw new Error(
        "Import liked tasks: no button and no task rows - nothing was imported.",
      );
    }

    await button.click();

    // The import is async; wait for a row rather than assuming the click landed.
    await firstRow.waitFor({ state: "visible", timeout: 30000 });
  }

  // --------------------------------------
  // Task Details Dialog
  // --------------------------------------

  /**
   * Opens the details dialog of a specified task.
   */
  /**
   * The text of the time entries inside a cell's popover, e.g.
   * ["00:30 TC4 - Updated task via automation."]. Lets a test verify an edit
   * actually landed rather than only that the edit action did not throw.
   *
   * Leaves the popover closed again so callers can carry on.
   */
  async getTimeEntriesInCell(cellInfo) {
    const cell = await this.getCell(cellInfo);
    await this.openCell(cell);
    await this.editTimeModal
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    const text = (await this.editTimeModal.first().innerText()) || "";

    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(500);

    return text.replace(/\s+/g, " ").trim();
  }

  async openTaskDetails(task) {
    const row = this.latestTimesheetTaskRows.filter({ hasText: task }).last();

    // Name the missing row instead of letting the click time out on it.
    await row.waitFor({ state: "visible", timeout: 20000 }).catch(() => {
      throw new Error(`No timesheet row for "${task}" in the current week.`);
    });

    await row.locator("span.truncate").first().click();
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
    // The dialog carries no accessible name, so match on the task it shows.
    const dialog = this.page
      .getByRole("dialog")
      .filter({ hasText: name })
      .first();
    await dialog.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});

    return await dialog.isVisible().catch(() => false);
  }
}
