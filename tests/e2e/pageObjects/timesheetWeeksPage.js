import { expect } from "@playwright/test";
import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";
import {
  pickCalendarDay,
  rowToggle,
  weekHeader,
  weekHeaders,
  weekRegion,
} from "./timesheetGrid";
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

    this.submitDialog = page.getByRole("dialog", {
      name: "Submit for approval",
    });
    // frappe-ui's MultiSelect drops its aria-label, and its name is the selection.
    this.approvalFilter = page
      .locator('button[aria-haspopup="listbox"]')
      .first();
    this.dateField = this.addTimeDialog.getByRole("combobox", {
      name: /^Date/,
    });
    this.halfDayField = this.addTimeOffDialog.getByPlaceholder(
      "Select half day date",
    );
    // A task cell opens a hover card listing the day's entries; it has no role.
    this.entryPopover = page
      .locator('[data-slot="content"][data-state="open"]')
      .last();
  }

  get weekHeaders() {
    return weekHeaders(this.page);
  }

  /** A week's header row, by its label ("This week", "Oct 5 - 11, 2026"). */
  weekHeader(label) {
    return weekHeader(this.page, label);
  }

  weekRegion(label) {
    return weekRegion(this.page, label);
  }

  async clickDay(isoDate) {
    await pickCalendarDay(this.page, isoDate);
  }

  /** The time-off dialog's From and To fields. */
  get dateFields() {
    return this.addTimeOffDialog.getByRole("combobox", { name: /^(From|To)/ });
  }

  /** As in the base page, but the leave duration is a radio group. */
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

  /** The day cells of a row, Monday first; their text is the hours or a dash. */
  cells(row) {
    // An empty cell's dash sits between spaces in its text.
    return row
      .getByRole("button")
      .filter({ hasText: /^\s*(\d{2}:\d{2}|-)\s*$/ });
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
    const toggle = rowToggle(this.page, label);
    await toggle.waitFor({ timeout: scaleTimeout(30000) });
    if ((await toggle.getAttribute("aria-expanded")) === "false") {
      await toggle.click();
    }
  }

  /** The rows of a week under its header (pl-3): its Total row first, then project and task rows. */
  rows(label) {
    return this.weekRegion(label).locator(
      "div.border-b.transition-colors:not(.pl-3)",
    );
  }

  /** The week's Total row, labelled "Projects / Tasks"; hidden while a task search is on. */
  totalRow(label) {
    return this.rows(label).filter({ hasText: /^\s*Projects\s*\/\s*Tasks/ });
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
    // Children: the label, the seven days, Total. A holiday's day also holds its
    // name for screen readers, so read only the first span.
    const days = row.locator(":scope > div");
    const hours = [];
    for (let day = 1; day <= 7; day++) {
      hours.push(
        (await days.nth(day).locator("span").first().innerText()).trim(),
      );
    }
    return hours;
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

  // --------------------------------------
  // Adding, editing and deleting time
  // --------------------------------------

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
    const popover = this.entryPopover;
    await this.editEntry(comment);
    const field = popover.getByPlaceholder("00:00");
    await field.fill(duration);
    // The masked field only commits on blur; without it the save posts the old value.
    await field.blur();
    await popover.getByRole("button", { name: "Save entry" }).click();
    // Saving goes back to the day's list of entries, which stays open.
    await popover.getByRole("button", { name: "Add time" }).waitFor();
    // One Escape was ignored while the dialog was still settling, so press until it closes.
    await expect(async () => {
      if (await popover.isVisible()) await this.page.keyboard.press("Escape");
      await expect(popover).toBeHidden({ timeout: scaleTimeout(3000) });
    }).toPass({ timeout: scaleTimeout(10000) });
  }

  /** Deletes the entry carrying `comment` in a task row's day cell. */
  async deleteEntry(cell, comment) {
    await cell.click();
    await this.editEntry(comment);
    await this.entryPopover
      .getByRole("button", { name: "Delete entry" })
      .click();
  }

  /** Opens the entry carrying `comment` in the open cell popover for editing. */
  async editEntry(comment) {
    // "Edit entry" only takes pointer events while its entry is hovered.
    const entry = this.entryPopover
      .locator("div.group")
      .filter({ hasText: comment })
      .first();
    await entry.waitFor({ timeout: scaleTimeout(15000) });
    await entry.hover();
    await entry.getByRole("button", { name: "Edit entry" }).click();
  }

  // --------------------------------------
  // Time-off and submitting
  // --------------------------------------

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
