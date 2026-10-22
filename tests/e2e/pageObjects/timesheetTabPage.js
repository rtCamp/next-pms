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

  /** Adds "<field> Equals <value>" for the Project or Task field, picking the value from its list. */
  async filterBy(field, value) {
    await this.openFilterPanel();
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
    await this.openFilterPanel();
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
