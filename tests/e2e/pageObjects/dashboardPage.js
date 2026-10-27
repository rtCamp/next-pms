import { gotoWithRetry } from "../utils/navigation";
import { escapeRegExp } from "../utils/stringUtils";
import { scaleTimeout } from "../utils/timeouts";

const API = "next_pms.api.dashboard.";

/**
 * The Manager and Leadership dashboards. Widgets are plain divs, so most areas are
 * found from their heading; the multi-selects all share the name "Select options".
 */
export class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.greeting = page.getByRole("heading", { level: 2, name: /^Hey, / });
    this.breadcrumbs = page.getByRole("banner").getByRole("button");

    // Notifications card and tray
    this.seeAll = page.getByRole("button", { name: "See all", exact: true });
    this.tray = page.getByRole("dialog", { name: "Notifications" });

    // Allocation calendar: the range label is a button that opens the date picker.
    this.rangeButton = page
      .getByRole("button", {
        name: /^[A-Z][a-z]{2} \d{1,2} – [A-Z][a-z]{2} \d{1,2}, \d{4}$/,
      })
      .first();
    this.previousRange = page.getByRole("button", { name: "Previous range" });
    this.nextRange = page.getByRole("button", { name: "Next range" });
    this.todayButton = page
      .getByRole("button", { name: "Today", exact: true })
      .first();
    this.calendarPicker = this.picker(
      /^(All projects|\d+ projects? selected)$/,
    );

    // Timesheets panel
    this.periodSelect = page
      .getByRole("combobox")
      .filter({ hasText: /^(Last week|This week)$/ });

    // Upcoming time-offs
    this.pendingBadge = page.getByText(/^\d+ pending$/);
    this.approveDialog = page.getByRole("dialog", {
      name: "Approve leave request",
    });
    this.rejectDialog = page.getByRole("dialog", {
      name: "Reject leave request",
    });
    this.rejectionReason = this.rejectDialog.getByPlaceholder(
      "Explain why this leave request is being rejected...",
    );
  }

  // ---------------------------------------------------------------- navigation

  /**
   * Opens a dashboard ("manager" or "leadership") and returns the JSON each named
   * endpoint answered while it loaded, keyed by method name.
   */
  async goto(view, methods = []) {
    const responses = methods.map((method) => this.response(method));
    await gotoWithRetry(this.page, `/next-pms/dashboard/${view}`);
    await this.waitForGreeting();
    const bodies = await Promise.all(responses);
    return Object.fromEntries(methods.map((m, i) => [m, bodies[i]]));
  }

  /** The first dashboard load on a fresh site can fail to render once; reload once before giving up. */
  async waitForGreeting() {
    try {
      await this.greeting.waitFor({ timeout: scaleTimeout(20000) });
    } catch {
      await this.page.reload();
      await this.greeting.waitFor({ timeout: scaleTimeout(30000) });
    }
  }

  /** The next successful answer of a dashboard endpoint, as its `message`. */
  async response(method, predicate = () => true) {
    const res = await this.page.waitForResponse(
      (r) =>
        r.url().includes(`${API}${method}`) &&
        r.status() === 200 &&
        predicate(new URL(r.url())),
      { timeout: scaleTimeout(45000) },
    );
    return (await res.json()).message;
  }

  /** Reloads the page and returns the endpoints' answers, as goto does. */
  async reload(methods = []) {
    const responses = methods.map((method) => this.response(method));
    await this.page.reload();
    await this.waitForGreeting();
    const bodies = await Promise.all(responses);
    return Object.fromEntries(methods.map((m, i) => [m, bodies[i]]));
  }

  // ---------------------------------------------------------------- widgets

  /** A widget's card, found from its heading. */
  section(heading) {
    return this.card(
      this.page.getByRole("heading", { name: heading, exact: true }),
    );
  }

  // Widget and stat cards share the card surface class; nothing else names them.
  card(inner) {
    return inner.locator(
      "xpath=ancestor::*[self::div or self::a][contains(@class,'bg-surface-cards')][1]",
    );
  }

  heading(name) {
    return this.page.getByRole("heading", { name, exact: true });
  }

  /** A multi-select, told apart by what its trigger reads. */
  picker(text) {
    return this.page
      .getByRole("combobox", { name: "Select options" })
      .filter({ hasText: text });
  }

  /** A widget's own multi-select, inside the card under its heading. */
  sectionPicker(heading) {
    return this.section(heading).getByRole("combobox", {
      name: "Select options",
    });
  }

  /** Toggles options of a multi-select, then closes it. */
  async toggle(picker, labels) {
    await picker.click();
    for (const label of labels) {
      await this.page.getByRole("option", { name: label, exact: true }).click();
    }
    await this.page.keyboard.press("Escape");
  }

  /** The options a multi-select shows as selected, leaving it closed. */
  async selectedOptions(picker) {
    await picker.click();
    const selected = await this.page
      .getByRole("option", { selected: true })
      .allInnerTexts();
    await this.page.keyboard.press("Escape");
    return selected.map((text) => text.trim());
  }

  // Stat card: label, value, then an optional sub-label.
  statCard(label) {
    return this.card(this.page.getByText(label, { exact: true }));
  }

  async statValue(label) {
    const lines = (await this.statCard(label).innerText())
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return lines[lines.indexOf(label) + 1];
  }

  statLink(label) {
    return this.page.getByRole("link", { name: new RegExp(`^${label}`) });
  }

  // Heatmap: one row header per role and a labelled span per week.
  heatmapRoles() {
    return this.section("Heatmap").getByRole("rowheader").allInnerTexts();
  }

  heatmapCells(role) {
    return this.section("Heatmap")
      .locator(`[aria-label^="${role} week of "]`)
      .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
  }

  // Notifications
  notification(title) {
    return this.section("Notifications").getByRole("link", {
      name: new RegExp(`^${escapeRegExp(title)}`),
    });
  }

  // Calendar: an item is its title and project in two paragraphs, on its start day.
  calendarItem(title) {
    return this.page.getByText(title, { exact: true });
  }

  /** Opens the range's date picker and picks a day; the range then starts on its Monday. */
  async pickCalendarDate(isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    const caption = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    await this.rangeButton.click();
    const picker = this.page.getByRole("dialog").filter({
      has: this.page.getByRole("grid", { name: "Calendar dates" }),
    });
    const shown = picker.getByRole("button", { name: "Toggle calendar view" });
    for (let step = 0; step < 24; step++) {
      const text = (await shown.innerText()).trim();
      if (text === caption) break;
      await picker
        .getByRole("button", {
          name: new Date(`${text} 1`) > date ? "Previous month" : "Next month",
        })
        .click();
    }
    // Days of the next and previous months spill into the grid.
    const days = picker.getByRole("gridcell", {
      name: String(date.getDate()),
      exact: true,
    });
    await (date.getDate() <= 15 ? days.first() : days.last()).click();
  }

  // Managed projects and Timesheets: list rows are grids found from their name.
  listRow(heading, name) {
    return this.section(heading)
      .getByText(name, { exact: true })
      .locator("xpath=ancestor::div[contains(@class,'grid')][1]");
  }

  async listRowValues(heading, name) {
    return (await this.listRow(heading, name).innerText())
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^-?[\d.]+h$/.test(line));
  }

  /** The names a list widget shows, in order: Timesheets links them, Managed projects does not. */
  listNames(heading) {
    const names =
      heading === "Timesheets"
        ? this.section(heading).getByRole("link")
        : this.section(heading).locator("div.grid span.font-medium");
    return names.allInnerTexts();
  }

  async choosePeriod(label) {
    await this.periodSelect.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  // Upcoming time-offs: a row is a list item; Open rows end with approve then reject.
  timeOffRow(employeeName) {
    return this.section("Upcoming time-offs")
      .getByRole("listitem")
      .filter({ hasText: employeeName });
  }

  timeOffRows() {
    return this.section("Upcoming time-offs").getByRole("listitem");
  }

  /** Each row's status badge, in list order. */
  async timeOffStatuses() {
    return this.timeOffRows().evaluateAll((rows) =>
      rows.map((row) => (/\bOpen\b/.test(row.innerText) ? "Open" : "Approved")),
    );
  }

  async openApprove(employeeName) {
    await this.timeOffRow(employeeName).getByRole("button").nth(0).click();
    await this.approveDialog.waitFor();
  }

  async openReject(employeeName) {
    await this.timeOffRow(employeeName).getByRole("button").nth(1).click();
    await this.rejectDialog.waitFor();
  }

  toast(text) {
    return this.page
      .getByRole("region", { name: /notification/i })
      .getByText(text)
      .first();
  }

  // Leadership KPI cards: label, month picker, then the value.
  kpiMonth(label) {
    return this.kpiCard(label).getByRole("button", {
      name: /^[A-Z][a-z]+ \d{4}$/,
    });
  }

  kpiCard(label) {
    return this.card(this.page.getByText(label, { exact: true }));
  }

  async kpiValue(label) {
    const lines = (await this.kpiCard(label).innerText())
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return lines[lines.length - 1];
  }

  /** Picks a month in a KPI card's month picker; `year` steps the picker when needed. */
  async chooseKpiMonth(label, monthShort, year) {
    await this.kpiMonth(label).click();
    const yearToggle = this.page.getByRole("button", {
      name: "Toggle between month and year selection",
    });
    for (let step = 0; step < 5; step++) {
      const shown = Number((await yearToggle.innerText()).trim());
      if (shown === year) break;
      await this.page
        .getByRole("button", {
          name: shown > year ? "Previous month" : "Next month",
        })
        .last()
        .click();
    }
    await this.page
      .getByRole("button", { name: monthShort, exact: true })
      .click();
  }
}
