import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";
import { TodoPage } from "./todoPage";

/**
 * A project's Calendar tab: the month toolbar, the Calendar / Gantt / List views,
 * the Milestones and Touchpoints table and the create/edit dialogs.
 */
export class ProjectCalendarPage extends TodoPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.todayButton = page.getByRole("button", { name: "Today", exact: true });
    this.previousButton = page.getByRole("button", { name: "Previous month" });
    this.nextButton = page.getByRole("button", { name: "Next month" });
    this.monthLabel = page.getByText(/^[A-Z][a-z]+ \d{4}$/).first();
    this.typeSelect = page.getByRole("combobox", { name: "Show" });
    this.createButton = page.getByRole("button", {
      name: "Create",
      exact: true,
    });
    this.itemDialog = page.getByRole("dialog", {
      name: /^(Create|Edit) (milestone|touchpoint)$/,
    });
  }

  async goto(projectId, params = {}) {
    const query = new URLSearchParams({ tab: "calendar", ...params });
    await gotoWithRetry(this.page, `/next-pms/projects/${projectId}?${query}`);
    await this.todayButton
      .or(this.page.getByRole("columnheader", { name: "Title" }))
      .first()
      .waitFor({ timeout: scaleTimeout(30000) });
  }

  /** The Calendar / Gantt / List switcher and the table's tabs are radio groups. */
  view(label) {
    return this.page.getByRole("radio", { name: label, exact: true });
  }

  /** Steps the calendar to the month holding the date. */
  async showMonth(isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    const wanted = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    for (let step = 0; step < 3; step++) {
      if ((await this.monthLabel.innerText()) === wanted) return;
      await this.nextButton.click();
    }
  }

  /** A milestone or touchpoint on the Calendar or Gantt view; the table below lists the titles too. */
  entry(title) {
    return this.page
      .getByText(title, { exact: true })
      .and(this.page.locator(":not([data-slot=list-row] *)"))
      .first();
  }

  async chooseType(label) {
    await this.typeSelect.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  field(placeholder) {
    return this.itemDialog.getByPlaceholder(placeholder);
  }

  /** Fills the milestone or touchpoint dialog; the date pickers take a typed YYYY-MM-DD. */
  async fillItem({ name, start, end, scheduled, owner }) {
    if (name !== undefined) {
      await this.itemDialog
        .getByPlaceholder(/^Enter (milestone|touchpoint) name$/)
        .fill(name);
    }
    if (start) await this.typeDate("Start date", start);
    if (end) await this.typeDate("Completion date", end);
    if (scheduled) await this.typeDate("Scheduled date", scheduled);
    if (owner) {
      await this.field("Select owner").click();
      await this.field("Select owner").fill(owner);
      await this.page.getByRole("option", { name: owner }).first().click();
    }
  }

  async typeDate(label, isoDate) {
    const input = this.itemDialog.getByRole("combobox", { name: label });
    await input.fill(isoDate);
    await input.press("Enter");
  }

  submitItem() {
    return this.itemDialog
      .getByRole("button", { name: /^(Create|Save)$/ })
      .click();
  }

  message(text) {
    return this.itemDialog.getByText(text, { exact: true });
  }
}
