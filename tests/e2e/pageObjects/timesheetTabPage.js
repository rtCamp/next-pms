import { expect } from "allure-playwright";
import { scaleTimeout } from "../utils/timeouts";

// A day cell prints its hours, or a dash with a space either side.
const DAY_CELL = /^\s*(\d{2}:\d{2}|-)\s*$/;

// How a week is labelled: "This week", "Last week", or its dates ("Oct 5 - 11, 2026").
const WEEK_LABEL = "(?:This week|Last week|[A-Z][a-z]{2} \\d+(?:, \\d{4})? - )";

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
  //
  // A week is a block of two parts: a header row (chevron, label, status, dates, Total, the
  // submit button) and a body of sibling rows. Nothing in it is a landmark, so the chevron,
  // named "Toggle <label>", is what finds the rest.

  /** The chevron that opens and closes a week; its name is the only text it has. */
  weekToggle(label) {
    return this.page.getByRole("button", {
      name: `Toggle ${label}`,
      exact: true,
    });
  }

  get weekToggles() {
    return this.page.getByRole("button", {
      name: new RegExp(`^Toggle ${WEEK_LABEL}`),
    });
  }

  /** The header rows of every week listed, newest first. */
  get weekHeaders() {
    return this.weekToggles.locator("xpath=ancestor::div[2]");
  }

  /** The header row of a week, by its label ("This week", "Oct 5 - 11, 2026"). */
  weekHeader(label) {
    return this.weekToggle(label).locator("xpath=ancestor::div[2]");
  }

  /** The whole week: header row and body. */
  weekRegion(label) {
    return this.weekToggle(label).locator("xpath=ancestor::div[4]");
  }

  /** The rows of a week's body, flat and in the order they are drawn. */
  weekRows(label) {
    return this.weekRegion(label).locator("xpath=./div[2]/div");
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
    const [year, month] = isoDate.split("-").map(Number);
    const heading = this.page.getByRole("button", {
      name: "cycle-calendar-view",
    });
    await heading.waitFor({ timeout: scaleTimeout(10000) });
    for (let paged = 0; paged < 24; paged++) {
      // "Oct 2026"
      const [shownMonth, shownYear] = (await heading.innerText()).split(" ");
      const shown = new Date(`${shownMonth} 1, ${shownYear}`);
      const gap =
        (year - shown.getFullYear()) * 12 + (month - 1) - shown.getMonth();
      if (gap === 0) break;
      await this.page
        .getByRole("button", {
          name: gap > 0 ? "next" : "previous",
          exact: true,
        })
        .click();
    }
    // `data-value`: the cell's name reads "(Today)" on today, and the grid also
    // shows a few days of the months either side.
    await this.page
      .locator(`[role="gridcell"][data-value="${isoDate}"]`)
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
    await this.filterValue.last().click();
    await this.clickDay(from);
    await this.clickDay(to);
    await this.closeFilterPanel();
  }
}
