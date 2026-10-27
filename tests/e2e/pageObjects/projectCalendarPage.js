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
    // Previous and Next are unlabelled icon buttons on either side of Today.
    this.previousButton = this.todayButton.locator(
      "xpath=preceding-sibling::button[1]",
    );
    this.nextButton = this.todayButton.locator(
      "xpath=following-sibling::button[1]",
    );
    this.monthLabel = page.getByText(/^[A-Z][a-z]+ \d{4}$/).first();
    this.typeSelect = page.getByRole("combobox").first();
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

  view(label) {
    return this.page.getByRole("button", { name: label, exact: true });
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

  /** A milestone or touchpoint on the Calendar or Gantt view; the table below has title buttons too. */
  entry(title) {
    return this.page
      .getByRole("button", { name: title, exact: true })
      .and(this.page.locator(":not(table *)"))
      .first();
  }

  async chooseType(label) {
    await this.typeSelect.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  field(placeholder) {
    return this.itemDialog.getByPlaceholder(placeholder);
  }

  /** Fills the milestone or touchpoint dialog; dates are plain YYYY-MM-DD inputs. */
  async fillItem({ name, start, end, scheduled, owner }) {
    if (name !== undefined) {
      await this.itemDialog
        .getByPlaceholder(/^Enter (milestone|touchpoint) name$/)
        .fill(name);
    }
    const triggers = this.itemDialog.getByRole("button", {
      name: /^\d{4}-\d{2}-\d{2}$/,
    });
    if (start) await this.pickDay(triggers.nth(0), start);
    if (end) await this.pickDay(triggers.nth(1), end);
    if (scheduled) await this.pickDay(triggers.nth(0), scheduled);
    if (owner) {
      await this.field("Select owner").click();
      await this.field("Select owner").fill(owner);
      await this.page.getByRole("option", { name: owner }).first().click();
    }
  }

  /** Opens a date button's calendar, steps to the month and picks the day. */
  async pickDay(trigger, isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    const caption = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    await trigger.click();
    const picker = this.page.locator("[data-side]:visible").last();
    for (let step = 0; step < 12; step++) {
      const shown = await picker.getByText(/^[A-Z][a-z]{2} \d{4}$/).innerText();
      if (shown === caption) break;
      await picker
        .getByRole("button", {
          name: new Date(`${shown} 1`) > date ? "Previous month" : "Next month",
        })
        .click();
    }
    // Days of the next and previous months spill into the grid.
    const days = picker.locator("button").filter({
      hasText: new RegExp(`^${date.getDate()}$`),
    });
    await (date.getDate() <= 15 ? days.first() : days.last()).click();
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
