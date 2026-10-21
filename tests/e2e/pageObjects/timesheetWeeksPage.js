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
    // The button after the search box; it names the status once one is chosen.
    this.approvalFilter = this.searchInput.locator(
      "xpath=following::button[1]",
    );

    this.addTimeDialog = page.getByRole("dialog", { name: "Add time" });
    this.addTimeOffDialog = page.getByRole("dialog", { name: "Add time off" });
    this.submitDialog = page.getByRole("dialog", {
      name: "Submit for approval",
    });

    this.dateField = this.addTimeDialog.getByRole("combobox", {
      name: /^Date/,
    });
    this.halfDayField = this.addTimeOffDialog.getByRole("combobox", {
      name: /^Half day date/i,
    });
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
    const toggle = this.weekToggle(label);
    await toggle.waitFor({ timeout: scaleTimeout(30000) });
    if ((await toggle.getAttribute("aria-expanded")) === "false") {
      await toggle.click();
    }
  }

  /** The first row of a week's body: the hours of every project and task together. */
  totalRow(label) {
    return this.weekRows(label).first();
  }

  /** The Total row's own label; a search hides the row, and this with it. */
  totalLabel(label) {
    return this.weekRegion(label).getByText("Projects", { exact: true });
  }

  /** A project or task row, by the exact text it carries. */
  row(label, name) {
    return this.weekRows(label).filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  /**
   * The Time-off row's days, Monday to Friday; they are plain text, not buttons. The weekend
   * cells print their own labels ("Saturday"), so the days after Friday are left out.
   */
  async timeOffHours(label) {
    const row = this.row(label, "Time-off");
    // The row is only there once the week has a leave or a holiday.
    if ((await row.count()) === 0) return Array(5).fill("-");
    const lines = (await row.innerText())
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.slice(1, 6);
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

  /** What a day cell opens: its entries, each with a comment, and an Add time button. */
  get cellPopover() {
    return this.page.locator('[data-slot="content"]').last();
  }

  /** The entry in the open popover that carries `comment`; its pencil shows on hover. */
  async openEntryEditor(comment) {
    const entry = this.cellPopover
      .locator("div")
      .filter({
        has: this.page.getByRole("button", { name: "Edit entry" }),
        hasText: comment,
      })
      .last();
    await entry.hover();
    await entry.getByRole("button", { name: "Edit entry" }).click();
  }

  /** Changes the hours of the entry carrying `comment` in a task row's day cell. */
  async updateEntry(cell, { comment, duration }) {
    await cell.click();
    await this.openEntryEditor(comment);
    const popover = this.cellPopover;
    const field = popover.getByPlaceholder("00:00");
    await field.fill(duration);
    // The masked field only commits on blur; without it the save posts the old value.
    await field.blur();
    await popover.getByRole("button", { name: "Save entry" }).click();
    await popover
      .getByRole("button", { name: "Save entry" })
      .waitFor({ state: "hidden", timeout: scaleTimeout(10000) });
    await this.page.keyboard.press("Escape");
    await popover.waitFor({ state: "hidden", timeout: scaleTimeout(10000) });
  }

  /** Deletes the entry carrying `comment` in a task row's day cell. */
  async deleteEntry(cell, comment) {
    await cell.click();
    await this.openEntryEditor(comment);
    await this.cellPopover
      .getByRole("button", { name: "Delete entry" })
      .click();
  }

  // --------------------------------------
  // Time-off and submitting
  // --------------------------------------

  /** The dialog's From and To fields. */
  get dateFields() {
    return this.addTimeOffDialog.getByRole("combobox", {
      name: /^(From|To)/,
    });
  }

  /** Sets a time-off range and duration ("Full Day", "First Half", "Second Half"), then picks the leave type and reason. */
  async fillTimeOff({ from, to = from, duration, type, reason }) {
    await this.pickDate(this.dateFields.nth(0), from);
    await this.pickDate(this.dateFields.nth(1), to);
    if (duration) {
      await this.addTimeOffDialog
        .getByRole("radio", { name: duration, exact: true })
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
