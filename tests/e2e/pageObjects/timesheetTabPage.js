import { expect } from "allure-playwright";
import { escapeRegExp } from "../utils/stringUtils";
import { scaleTimeout } from "../utils/timeouts";

// A day cell prints its hours, or a dash.
const DAY_CELL = /^(\d{2}:\d{2}|-)$/;

// A week with no timesheet has nothing after its label, so the name may end there.
const weekName = (label) => new RegExp(`^${escapeRegExp(label)}(?: |$)`);

/**
 * What the Personal and Project timesheet tabs share: the weeks they list, the
 * Filter panel (a "Where <field> <operator> <value>" query builder) and the
 * calendar its Date field and the date fields of the dialogs open.
 */
export class TimesheetTabPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.filterButton = page.getByRole("button", { name: /^Filter/ }).first();
    this.clearAllFiltersButton = page.getByRole("button", {
      name: "Clear all filters",
    });
    this.filterField = page.getByPlaceholder("Field");
    this.filterOperator = page.getByPlaceholder("Operator");
    this.filterValue = page.getByPlaceholder("Value");
    this.approvalFilter = page.getByRole("combobox", {
      name: "Select options",
    });
    // `.first()`: a previous toast with the same text can still be on screen.
    this.toast = (text) =>
      page
        .getByRole("region", { name: /notification/i })
        .getByText(text)
        .first();

    this.addTimeDialog = page.getByRole("dialog", { name: "Add time" });
    this.addTimeOffDialog = page.getByRole("dialog", { name: "Add time off" });
    this.dateField = this.addTimeDialog.getByRole("button", {
      name: /^\d{4}-\d{2}-\d{2}$/,
    });
    this.halfDayField = this.addTimeOffDialog
      .getByRole("button")
      .filter({ has: page.getByRole("textbox", { name: /Half Day Date/ }) });
  }

  // --------------------------------------
  // Weeks
  // --------------------------------------

  get weekHeaders() {
    return this.page.getByRole("button", {
      name: /^(This week|Last week|[A-Z][a-z]{2} \d+(, \d{4})? - )/,
    });
  }

  /** The header button of a week, by its label ("This week", "Oct 5 - 11, 2026"). */
  weekHeader(label) {
    return this.page.getByRole("button", { name: weekName(label) });
  }

  weekRegion(label) {
    return this.page.getByRole("region", { name: weekName(label) });
  }

  /** The day cells of a row, Monday first; their text is the hours or a dash. */
  cells(row) {
    return row.getByRole("button").filter({ hasText: DAY_CELL });
  }

  /** The hours a row adds up to: the last thing it prints. */
  async rowTotal(row) {
    return (await row.innerText()).trim().split("\n").pop().trim();
  }

  // --------------------------------------
  // Search and Approval status
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
  // Filter panel
  // --------------------------------------

  async openFilterPanel() {
    if (!(await this.filterField.first().isVisible())) {
      await this.filterButton.click();
      await this.filterField.first().waitFor({ timeout: scaleTimeout(15000) });
    }
  }

  async closeFilterPanel() {
    // Not Escape: on a value combobox it clears what was just picked.
    await this.filterButton.click();
    await this.filterField
      .first()
      .waitFor({ state: "hidden", timeout: scaleTimeout(10000) })
      .catch(() => {});
  }

  /** Opens the panel on a row with no value yet, adding one when the last row is a whole condition. */
  async openEmptyFilterRow() {
    await this.openFilterPanel();
    const rows = await this.filterField.count();
    // The panel can open on a row whose field is preset but whose value is empty.
    if (await this.filterValue.last().inputValue()) {
      await this.page.getByRole("button", { name: "Add filter" }).click();
      await expect(this.filterField).toHaveCount(rows + 1);
    }
  }

  /** Adds "<field> Equals <value>", picking the value from its list. */
  async filterBy(field, value) {
    await this.openEmptyFilterRow();
    const input = this.filterField.last();
    await input.click();
    await input.fill(field);
    await this.page
      .getByRole("option", { name: new RegExp(`^${field}$`, "i") })
      .first()
      .click();
    await this.filterOperator.last().click();
    await this.page
      .getByRole("option", { name: "Equals", exact: true })
      .click();
    const valueInput = this.filterValue.last();
    await valueInput.click();
    await valueInput.fill(value);
    const option = this.page.getByRole("option", { name: value }).first();
    await option.waitFor({ timeout: scaleTimeout(15000) });
    await option.click();
    await expect(valueInput).toHaveValue(value);
    await this.closeFilterPanel();
  }

  // --------------------------------------
  // Add time and Add time-off dialogs
  // --------------------------------------

  /** Picks a value in one of a dialog's comboboxes by its placeholder. */
  async choose(placeholder, value, dialog = this.addTimeDialog) {
    const input = dialog.getByPlaceholder(placeholder);
    await input.click();
    await input.fill(value);
    await this.page.getByRole("option", { name: value }).first().click();
  }

  /** The dialog's From and To fields; the picker names both by the date they hold. */
  get dateFields() {
    return this.addTimeOffDialog.getByRole("button", {
      name: /^\d{4}-\d{2}-\d{2}$/,
    });
  }

  /**
   * Sets a time-off range and duration ("Full Day", "First Half", "Second Half"), then picks
   * the leave type and reason; on the Team tab, `employee` first (it enables Leave type).
   */
  async fillTimeOff({ employee, from, to = from, duration, type, reason }) {
    if (employee) {
      await this.choose("Select employee", employee, this.addTimeOffDialog);
    }
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

  // --------------------------------------
  // Dates
  // --------------------------------------

  /** Pages the open calendar to the month of `isoDate` and clicks that day. */
  async clickDay(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const target = new Date(year, month - 1, day);
    const heading = this.page.getByRole("button", {
      name: "Toggle calendar view",
    });
    await heading.waitFor({ timeout: scaleTimeout(10000) });
    for (let paged = 0; paged < 24; paged++) {
      const shown = new Date(`${await heading.innerText()} 1`);
      const gap =
        (target.getFullYear() - shown.getFullYear()) * 12 +
        target.getMonth() -
        shown.getMonth();
      if (gap === 0) break;
      await this.page
        .getByRole("button", {
          name: gap > 0 ? "Next month" : "Previous month",
        })
        .click();
    }
    // The grid also shows a few days of the months either side, in a lighter colour.
    await this.page
      .locator('[role="gridcell"]:not(.text-ink-gray-3)')
      .filter({ hasText: new RegExp(`^${day}$`) })
      .click();
  }

  /** Opens a date field's picker and picks `isoDate`. */
  async pickDate(trigger, isoDate) {
    await trigger.click();
    await this.clickDay(isoDate);
  }

  /** Adds "Date between <from> and <to>" to the Filter panel. */
  async filterByDate(from, to) {
    await this.openEmptyFilterRow();
    const input = this.filterField.last();
    await input.click();
    await input.fill("Date");
    await this.page
      .getByRole("option", { name: /^Date$/i })
      .first()
      .click();
    await this.page
      .locator("span[role=button][aria-haspopup=dialog]")
      .last()
      .click();
    await this.clickDay(from);
    await this.clickDay(to);
    await this.closeFilterPanel();
  }
}
