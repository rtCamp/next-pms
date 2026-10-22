import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";
import { TimesheetTabPage } from "./timesheetTabPage";

/**
 * The Personal Timesheet tab seen as weeks: each week has a header (label, status,
 * Total and its submit button) over a Total row, project rows and task rows.
 */
export class TimesheetWeeksPage extends TimesheetTabPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.addTimeButton = page
      .getByRole("banner")
      .getByRole("button", { name: "Add time", exact: true });
    this.addTimeOffButton = page.getByRole("button", {
      name: "Add time-off",
      exact: true,
    });

    this.searchInput = page.getByPlaceholder("Search tasks");

    this.addTimeDialog = page.getByRole("dialog", { name: "Add time" });
    this.addTimeOffDialog = page.getByRole("dialog", { name: "Add time off" });
    this.submitDialog = page.getByRole("dialog", {
      name: "Submit for approval",
    });

    this.dateField = this.addTimeDialog.getByRole("button", {
      name: /^\d{4}-\d{2}-\d{2}$/,
    });
    this.halfDayField = this.addTimeOffDialog
      .getByRole("button")
      .filter({ has: page.getByRole("textbox", { name: /Half Day Date/ }) });
  }

  // --------------------------------------
  // Navigation and state
  // --------------------------------------

  /** Opens the tab; `params` is the state kept in its URL (search, approval, compositeFilters). */
  async goto(params = {}) {
    const query = new URLSearchParams(params).toString();
    await gotoWithRetry(
      this.page,
      `/next-pms/timesheet${query ? `?${query}` : ""}`,
    );
    await this.addTimeButton.waitFor({ timeout: scaleTimeout(40000) });
    await this.weekHeaders.first().waitFor({ timeout: scaleTimeout(40000) });
  }

  /**
   * Loads the tab again. The grid follows the server through a realtime event,
   * which a site without the realtime service never sends, so a saved change
   * shows once the page is fetched afresh.
   */
  async reload(label) {
    await this.page.reload();
    await this.weekHeaders.first().waitFor({ timeout: scaleTimeout(40000) });
    if (label) await this.expandWeek(label);
  }

  // --------------------------------------
  // A week
  // --------------------------------------

  /** The week's status badge text, e.g. "Not submitted". */
  async weekStatus(label) {
    return (
      await this.weekHeader(label)
        .locator("div.rounded-full")
        .first()
        .innerText()
    ).trim();
  }

  async expandWeek(label) {
    const header = this.weekHeader(label);
    await header.waitFor({ timeout: scaleTimeout(30000) });
    if ((await header.getAttribute("aria-expanded")) === "false") {
      await header.click();
    }
  }

  /** The rows of a week: its Total row first, then project and task rows. */
  rows(label) {
    return this.weekRegion(label).locator("div.border-b.transition-colors");
  }

  totalRow(label) {
    return this.rows(label).first();
  }

  /** A project or task row, by the exact text it carries. */
  row(label, name) {
    return this.rows(label).filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  /** The Time-off row's seven days, Monday first; they are plain text, not buttons. */
  async timeOffHours(label) {
    const row = this.row(label, "Time-off");
    // The row is only there once the week has a leave or a holiday.
    if ((await row.count()) === 0) return Array(7).fill("-");
    const lines = (await row.innerText())
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.slice(1, 8);
  }

  submitButton(label) {
    return this.weekHeader(label).getByRole("button", {
      name: "Submit for approval",
      exact: true,
    });
  }

  // --------------------------------------
  // Search and filters
  // --------------------------------------

  async search(term) {
    await this.searchInput.fill(term);
  }

  async chooseApprovalStatus(status) {
    await this.approvalFilter.click();
    await this.page.getByRole("option", { name: status, exact: true }).click();
    await this.page.keyboard.press("Escape");
  }

  // --------------------------------------
  // Adding, editing and deleting time
  // --------------------------------------

  /** Picks a value in one of the Add time dialog's comboboxes by its placeholder. */
  async choose(placeholder, value) {
    const input = this.addTimeDialog.getByPlaceholder(placeholder);
    await input.click();
    await input.fill(value);
    await this.page.getByRole("option", { name: value }).first().click();
  }

  /** Books time from a week's Total row cell, which opens the dialog on that day. */
  async addTime(label, dayIndex, { project, task, duration, comment }) {
    await this.cells(this.totalRow(label)).nth(dayIndex).click();
    await this.addTimeDialog.waitFor({ timeout: scaleTimeout(15000) });
    await this.choose("Select project", project);
    await this.choose("Select task", task);
    await this.addTimeDialog.getByPlaceholder("00:00").fill(duration);
    await this.addTimeDialog.locator("[contenteditable]").first().fill(comment);
    await this.addTimeDialog
      .getByRole("button", { name: "Save and close" })
      .click();
  }

  /** Changes the hours of the entry carrying `comment` in a task row's day cell. */
  async updateEntry(cell, { comment, duration }) {
    await cell.click();
    const popover = this.page.getByRole("dialog").last();
    const entry = popover.filter({ hasText: comment }).first();
    await entry.getByRole("button").filter({ hasText: /^$/ }).first().click();
    const field = popover.getByPlaceholder("00:00");
    await field.fill(duration);
    // The masked field only commits on blur; without it the save posts the old value.
    await field.blur();
    await popover.getByRole("button", { name: "Save entry" }).click();
    // Saving goes back to the day's list of entries, which stays open.
    await popover.getByRole("button", { name: "Add time" }).waitFor();
    await this.page.keyboard.press("Escape");
    await popover.waitFor({ state: "hidden", timeout: scaleTimeout(10000) });
  }

  /** Deletes the entry carrying `comment` in a task row's day cell. */
  async deleteEntry(cell, comment) {
    await cell.click();
    const popover = this.page.getByRole("dialog").last();
    const item = popover
      .getByRole("region")
      .filter({ hasText: comment })
      .first()
      .locator("xpath=..");
    await item.hover();
    await item
      .locator('button[class*="absolute"][class*="right-0"]')
      .first()
      .click();
    await popover.getByRole("button", { name: "Delete entry" }).click();
  }

  // --------------------------------------
  // Time-off and submitting
  // --------------------------------------

  /** The dialog's From and To fields; the picker names both by the date they hold. */
  get dateFields() {
    return this.addTimeOffDialog.getByRole("button", {
      name: /^\d{4}-\d{2}-\d{2}$/,
    });
  }

  /** Sets a time-off range and duration ("Full Day", "First Half", "Second Half"), then picks the leave type and reason. */
  async fillTimeOff({ from, to = from, duration, type, reason }) {
    await this.pickDate(this.dateFields.nth(0), from);
    await this.pickDate(this.dateFields.nth(1), to);
    if (duration) {
      await this.addTimeOffDialog
        .getByRole("button", { name: duration, exact: true })
        .click();
    }
    if (type) {
      await this.addTimeOffDialog
        .getByRole("combobox", { name: /Leave type/ })
        .click();
      await this.page.getByRole("option", { name: type }).click();
    }
    if (reason) {
      await this.addTimeOffDialog
        .getByRole("textbox", { name: /Reason/ })
        .fill(reason);
    }
  }

  async saveTimeOff() {
    await this.addTimeOffDialog
      .getByRole("button", { name: "Add time-off", exact: true })
      .click();
  }

  /** Sends a week for approval; `approver` is only picked when the dialog has none preset. */
  async submitWeek(label, approver) {
    await this.submitButton(label).click();
    await this.submitDialog.waitFor({ timeout: scaleTimeout(15000) });
    const sendTo = this.submitDialog.getByRole("combobox", {
      name: "Send to (required)",
    });
    if (!(await sendTo.inputValue())) {
      await sendTo.click();
      await sendTo.fill(approver);
      await this.page.getByRole("option", { name: approver }).first().click();
    }
    await this.submitDialog.getByRole("button", { name: "Submit" }).click();
  }
}
