import { expect } from "@playwright/test";
import { gotoWithRetry } from "../utils/navigation.js";
import { escapeRegExp } from "../utils/stringUtils";
import { scaleTimeout } from "../utils/timeouts";

// The grid is a flat list of rows with no table roles: a week's rows follow its header
// inside one `scroll-mt-7` wrapper, and depth is the row's indent class (pl-7.5 member,
// pl-13.5 project or time-off, pl-19.5 task). Each collapsible row has a
// "Toggle <label>" chevron that carries `aria-expanded`.
const ROW = "div.border-b.transition-colors";
const MEMBER_ROW = `${ROW}[class~="pl-7.5"]`;
const DETAIL_ROW = `${ROW}[class~="pl-13.5"], ${ROW}[class~="pl-19.5"]`;
const WEEK_TOGGLE =
  /^Toggle (This week|Last week|[A-Z][a-z]{2} \d+(, \d{4})? - )/;
const STATUS =
  /^(Not submitted|Approval pending|Approved|Rejected|Partially approved|Partially rejected|Processing)/i;
// A week still to submit has no review button; every other status has one, named after it.
const REVIEWABLE =
  /^(Approval pending|Approved|Rejected|Partially approved|Partially rejected)$/;
const EMPTY_WEEK = "No timesheet for this week";
const MEMBERS_API = "next_pms.timesheet.api.team.get_team_timesheet_data";

/** The query a request was sent with, from its URL (GET) or its JSON body. */
const paramsOf = (response) => {
  const params = Object.fromEntries(new URL(response.url()).searchParams);
  try {
    return { ...params, ...(response.request().postDataJSON() ?? {}) };
  } catch {
    return params;
  }
};

/**
 * The Team tab of the Timesheet: each week lists the members, a member row opens onto
 * the projects and tasks they logged, and a submitted week opens the approval drawer.
 */
export class TeamPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // A row's direct children: label, Mon..Sun, Total, then the review button.
    this.dayIndexObj = {
      member: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
      sun: 7,
      total: 8,
      status: 9,
    };

    this.searchInput = page.getByPlaceholder("Search members");
    this.reportsToDropdown = page.getByRole("combobox", { name: "Reports to" });
    this.noData = page.getByText("No data", { exact: true });
    this.busy = page.locator('[aria-busy="true"]');

    // The label carries the number of conditions ("Filter 1").
    this.filterButton = page.getByRole("button", { name: /^Filter/ }).first();
    this.filterField = page.getByPlaceholder("Field");
    this.filterOperator = page.getByPlaceholder("Operator");
    this.filterValue = page.getByPlaceholder("Value");

    this.weekToggles = page.getByRole("button", { name: WEEK_TOGGLE });

    this.reviewTimesheetPane = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Approve", exact: true }),
    });
    this.rejectTimesheetModal = page.getByRole("dialog").filter({
      has: page.getByRole("heading", {
        name: "Reason for timesheet rejection",
      }),
    });
    this.rejectReasonInput = this.rejectTimesheetModal.getByPlaceholder(
      "Enter reason for rejection",
    );
    this.confirmRejectButton = this.rejectTimesheetModal.getByRole("button", {
      name: "Reject timesheet",
      exact: true,
    });

    this.employeeNameInTable = (employeeName) =>
      page
        .getByRole("button", { name: `Toggle ${employeeName}`, exact: true })
        .first();

    this.toastNotification = (notificationMessage) =>
      page
        .getByRole("region", { name: /notification/i })
        .getByText(notificationMessage)
        .first();
  }

  // --------------------------------------
  // General
  // --------------------------------------

  /** Opens the team view for the configured reporting manager. */
  async goto() {
    await gotoWithRetry(
      this.page,
      `/next-pms/timesheet/team?reportsTo=${process.env.REP_MAN_ID}`,
    );
    await this.waitForGrid();
  }

  weekToggle(label) {
    return this.page.getByRole("button", {
      name: `Toggle ${label}`,
      exact: true,
    });
  }

  /** A week: its header row and every row under it. */
  weekRegion(label = "This week") {
    return this.page
      .locator("div.scroll-mt-7")
      .filter({ has: this.weekToggle(label) });
  }

  memberRows(weekLabel = "This week") {
    return this.weekRegion(weekLabel).locator(MEMBER_ROW);
  }

  memberRow(name, weekLabel = "This week") {
    return this.memberRows(weekLabel).filter({
      has: this.page.getByRole("button", {
        name: `Toggle ${name}`,
        exact: true,
      }),
    });
  }

  /** Waits for the weeks, then for the current week's first page of members. */
  async waitForGrid() {
    await this.weekToggles
      .first()
      .or(this.noData)
      .first()
      .waitFor({ timeout: scaleTimeout(40000) });
    await expect(this.busy).toHaveCount(0, { timeout: scaleTimeout(40000) });

    const toggle = this.weekToggle("This week");
    if (
      (await toggle.count()) === 0 ||
      (await toggle.getAttribute("aria-expanded")) !== "true"
    ) {
      return;
    }
    const week = this.weekRegion();
    await week
      .locator(MEMBER_ROW)
      .first()
      .or(week.getByText(EMPTY_WEEK))
      .first()
      .waitFor({ timeout: scaleTimeout(40000) });
  }

  /**
   * Runs `action`, a filter change, and waits for the members loaded with the filters
   * `matches` accepts. The weeks re-render under the new filters before their members
   * load, so the rows read afterwards are the filtered ones. `matches` is checked after
   * the action, so it can depend on what the action changed.
   */
  async applyAndWait(action, matches = () => true, unchanged = () => false) {
    const queries = [];
    const record = (response) => {
      if (response.url().includes(MEMBERS_API))
        queries.push(paramsOf(response));
    };
    this.page.on("response", record);
    try {
      await action();
      if (unchanged()) return;
      await expect
        .poll(() => queries.some((query) => matches(query)), {
          timeout: scaleTimeout(40000),
        })
        .toBe(true);
    } finally {
      this.page.off("response", record);
    }
    await this.waitForGrid();
  }

  /** A filter kept in the page's URL. */
  urlParam(name) {
    return new URL(this.page.url()).searchParams.get(name);
  }

  // --------------------------------------
  // Search and Reports to
  // --------------------------------------

  async searchEmployee(name) {
    if ((await this.searchInput.inputValue()) === name) return;
    await this.applyAndWait(
      () => this.searchInput.fill(name),
      (params) => (params.search ?? "") === name,
    );
  }

  async applyReportsTo(name) {
    const before = this.urlParam("reportsTo");
    let after = before;
    await this.applyAndWait(
      async () => {
        await this.reportsToDropdown.click();
        await this.reportsToDropdown.fill(name);
        await this.page.getByRole("option", { name }).first().click();
        // Choosing the manager already filtered on changes nothing and loads nothing.
        await expect
          .poll(() => this.urlParam("reportsTo"), { timeout: 3000 })
          .not.toBe(before)
          .catch(() => {});
        after = this.urlParam("reportsTo");
      },
      (params) => params.reports_to === after,
      () => after === before,
    );
  }

  /** Brings a member's row into the current week, searching when it is not on the first page. */
  async findMember(name) {
    await this.waitForGrid();
    if ((await this.memberRow(name).count()) === 0) {
      await this.searchEmployee(name);
    }
    const row = this.memberRow(name);
    await row.waitFor({ timeout: scaleTimeout(20000) });
    return row;
  }

  // --------------------------------------
  // Members and their breakdown
  // --------------------------------------

  /** The names of the members the current week lists. */
  async getEmployees() {
    await this.waitForGrid();
    const labels = await this.memberRows()
      .getByRole("button", { name: /^Toggle / })
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label")),
      );
    return labels.map((label) => label.replace(/^Toggle /, "").trim());
  }

  /** Searches for a member and opens their row onto the projects and tasks they logged. */
  async expandEmployeeRow(name) {
    await this.searchEmployee(name);
    const toggle = this.memberRow(name).getByRole("button", {
      name: `Toggle ${name}`,
      exact: true,
    });
    await toggle.waitFor({ timeout: scaleTimeout(20000) });
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await this.weekRegion()
      .locator(DETAIL_ROW)
      .first()
      .waitFor({ timeout: scaleTimeout(15000) })
      .catch(() => {});
  }

  async toggleEmployeeTimesheet(name) {
    await this.expandEmployeeRow(name);
  }

  /** Labels of the project, task and time-off rows open in the current week. */
  async getEmployeeDetailRows() {
    const labels = [];
    for (const row of await this.weekRegion().locator(DETAIL_ROW).all()) {
      const text = await row.locator("> div").first().innerText();
      labels.push(text.split("\n")[0].trim());
    }
    return labels;
  }

  async isEmployeeTimesheetVisible() {
    return (await this.getEmployeeDetailRows()).length > 0;
  }

  /** The member's status as their row prints it, e.g. "Approval pending". */
  async getTimesheetStatus(name) {
    const row = await this.findMember(name);
    const lines = (await row.locator("> div").first().innerText())
      .split("\n")
      .map((line) => line.trim());
    return lines.find((line) => STATUS.test(line)) ?? "";
  }

  /**
   * A row of the current week: "employee header" is the member's own row, "time off"
   * their Time-off row, anything else a project or task row under them.
   */
  async getRow({ employee, rowName }) {
    if (!employee) {
      return this.weekRegion().locator(ROW).first();
    }
    const member = await this.findMember(employee);
    switch (rowName.toLowerCase()) {
      case "employee header":
        return member;
      case "time off":
        return this.weekRegion()
          .locator(DETAIL_ROW)
          .filter({ hasText: /^Time-?off/i })
          .first();
      default:
        return this.weekRegion()
          .locator(DETAIL_ROW)
          .filter({ hasText: rowName })
          .first();
    }
  }

  async getCell({ employee, rowName, col }) {
    const row = await this.getRow({ employee, rowName });
    await row.waitFor({ timeout: scaleTimeout(20000) });
    const colIndex = this.dayIndexObj[col.toLowerCase()];
    if (colIndex === undefined) {
      throw new Error(
        `getCell: unknown column "${col}". Known: ${Object.keys(this.dayIndexObj).join(", ")}`,
      );
    }
    return row.locator("> div").nth(colIndex);
  }

  async getCellText(cellInfo) {
    const cell = await this.getCell(cellInfo);
    return (await cell.isVisible()) ? await cell.innerText() : "-";
  }

  // --------------------------------------
  // Weeks
  // --------------------------------------

  /** Week labels in display order, newest first. */
  async getWeekLabels() {
    await this.weekToggles.first().waitFor({ timeout: scaleTimeout(20000) });
    const labels = await this.weekToggles.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")),
    );
    return labels.map((label) => label.replace(/^Toggle /, ""));
  }

  async getOpenWeekLabels() {
    const open = [];
    for (const label of await this.getWeekLabels()) {
      if (
        (await this.weekToggle(label).getAttribute("aria-expanded")) === "true"
      ) {
        open.push(label);
      }
    }
    return open;
  }

  async toggleWeek(label, expanded) {
    const toggle = this.weekToggle(label);
    await toggle.waitFor({ timeout: scaleTimeout(15000) });
    if (
      ((await toggle.getAttribute("aria-expanded")) === "true") !==
      expanded
    ) {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute("aria-expanded", String(expanded));
  }

  /**
   * There is no week paging: the weeks are stacked newest first, so going back a week
   * opens the next older one.
   */
  async viewPreviousWeek() {
    const labels = await this.getWeekLabels();
    const open = await this.getOpenWeekLabels();
    const oldestOpen = open.length ? labels.indexOf(open.at(-1)) : -1;
    await this.toggleWeek(
      labels[Math.min(oldestOpen + 1, labels.length - 1)],
      true,
    );
  }

  /** Steps back toward the present by closing the oldest open week; a no-op with one open. */
  async viewNextWeek() {
    const open = await this.getOpenWeekLabels();
    if (open.length <= 1) return;
    await this.toggleWeek(open.at(-1), false);
  }

  /** The date an open week's header prints over a day column, e.g. "Oct 12", for the current week. */
  async getColDate(col) {
    const [current] = await this.getWeekLabels();
    if (!current) return "-";
    await this.toggleWeek(current, true);
    const header = this.weekRegion(current).locator(ROW).first();
    const text = await header
      .locator("> div")
      .nth(this.dayIndexObj[col.toLowerCase()])
      .innerText();
    return text.replace(/\s+/g, " ").trim();
  }

  // --------------------------------------
  // Approval drawer
  // --------------------------------------

  async openReviewTimesheetPane(employee) {
    const row = await this.findMember(employee);
    await row.getByRole("button", { name: REVIEWABLE }).click();
    await this.reviewTimesheetPane.waitFor({ timeout: scaleTimeout(20000) });
  }

  async isReviewTimesheetPaneVisible() {
    return await this.reviewTimesheetPane.isVisible();
  }

  /** An entry in the drawer, by the task, project and comment it shows. */
  getTimeEntryRow({ project, task, desc }) {
    let entry = this.reviewTimesheetPane.locator("div.group.flex.gap-3");
    for (const text of [task, project, desc]) {
      if (text) entry = entry.filter({ hasText: text });
    }
    return entry.first();
  }

  async updateDurationOfTimeEntry({ project, task, desc, newDuration }) {
    const row = this.getTimeEntryRow({ project, task, desc });
    await row.waitFor({ timeout: scaleTimeout(20000) });
    // The pencil only shows on hover, and is disabled once the entry is decided.
    await row.hover();
    await row.getByRole("button", { name: "Edit time entry" }).click();

    const duration = row.getByPlaceholder("00:00");
    await duration.fill(newDuration);
    // The duration is committed on blur.
    await duration.blur();
    await row.getByRole("button", { name: "Save entry" }).click();
  }

  async actOnTimeEntry(action) {
    await this.reviewTimesheetPane
      .getByRole("button", { name: action, exact: true })
      .click();
  }

  async rejectTimesheet({ employee, reason, notification }) {
    await this.openReviewTimesheetPane(employee);
    await this.actOnTimeEntry("Reject");
    await this.rejectTimesheetModal.waitFor({ timeout: scaleTimeout(20000) });
    await this.rejectReasonInput.fill(reason);
    await this.confirmRejectButton.click();
    await this.toastNotification(notification).waitFor({
      timeout: scaleTimeout(20000),
    });

    // A queued job applies the rejection; the row shows it once the page is fetched again.
    await expect
      .poll(
        async () => {
          await this.page.reload({ waitUntil: "domcontentloaded" });
          return await this.getTimesheetStatus(employee);
        },
        { timeout: scaleTimeout(60000), intervals: [2000, 3000, 5000] },
      )
      .toMatch(/rejected/i);
  }

  // --------------------------------------
  // Task details
  // --------------------------------------

  /** Clicks a task's name under an open member, which opens its log. */
  async openTaskDetails({ employee, task }) {
    await this.findMember(employee);
    await this.weekRegion()
      .getByRole("button", { name: task, exact: true })
      .first()
      .click();
  }

  async isTaskDetailsDialogVisible(name) {
    const dialog = this.page
      .getByRole("dialog")
      .filter({ has: this.page.getByRole("heading", { name }) });
    return await dialog
      .waitFor({ timeout: scaleTimeout(15000) })
      .then(() => true)
      .catch(() => false);
  }

  // --------------------------------------
  // Filter panel
  // --------------------------------------

  /** Opens the panel, which starts a blank row when there is none. */
  async openFilterPanel() {
    if (!(await this.filterField.first().isVisible())) {
      await this.filterButton.click();
      await this.filterField.first().waitFor({ timeout: scaleTimeout(15000) });
    }
  }

  async closeFilterPanel() {
    if (!(await this.filterField.first().isVisible())) return;
    // Not Escape: on a value combobox it clears what was just picked.
    await this.filterButton.click();
    await this.filterField
      .first()
      .waitFor({ state: "hidden", timeout: scaleTimeout(10000) });
  }

  async checkEmployeeStatus(empStatus) {
    await this.addFilterCondition("Member Status", empStatus);
  }

  async checkProjectStatus(projectName) {
    await this.addFilterCondition("Project", projectName);
  }

  /** Adds Business Unit as a condition of its own, next to any already set. */
  async checkBusinessUnit(businessUnit) {
    await this.openFilterPanel();
    const lastValue = await this.filterValue.last().inputValue();
    await this.addFilterCondition(
      "Business Unit",
      businessUnit,
      lastValue !== "",
    );
  }

  /**
   * Sets the last condition, or a new one with `needsNewRow`, to "<field> <first
   * operator> <value>": Equals for a link, "is" for a list of options.
   */
  async addFilterCondition(fieldLabel, value, needsNewRow = false) {
    const exact = (text) => new RegExp(`^${escapeRegExp(text)}$`, "i");
    await this.openFilterPanel();
    if (needsNewRow) {
      const rows = await this.filterField.count();
      await this.page.getByRole("button", { name: "Add filter" }).click();
      await expect(this.filterField).toHaveCount(rows + 1);
    }

    const field = this.filterField.last();
    await field.click();
    await field.fill(fieldLabel);
    await this.page.getByRole("option", { name: exact(fieldLabel) }).click();

    await this.filterOperator.last().click();
    await this.page.getByRole("option").first().click();

    // A link's value is sent as its ID, not the name picked, so wait for a change.
    const before = this.urlParam("compositeFilters");
    let after = before;
    await this.applyAndWait(
      async () => {
        const input = this.filterValue.last();
        await input.click();
        await input.fill(value);
        const option = this.page.getByRole("option", { name: exact(value) });
        await option.first().waitFor({ timeout: scaleTimeout(15000) });
        await option.first().click();
        await expect
          .poll(() => this.urlParam("compositeFilters"))
          .not.toBe(before);
        after = this.urlParam("compositeFilters");
      },
      (params) =>
        Boolean(params.filters) &&
        JSON.parse(after)
          .filter(({ value: set }) => set !== null && set !== "")
          .every(({ value: set }) =>
            params.filters.includes(JSON.stringify(set)),
          ),
    );
    await this.closeFilterPanel();
  }

  /** The fields of the conditions in the panel, e.g. ["Project", "Business Unit"]. */
  async getAppliedFilterFields() {
    await this.openFilterPanel();
    const values = await this.filterField.evaluateAll((inputs) =>
      inputs.map((input) => input.value.trim()),
    );
    await this.closeFilterPanel();
    return values.filter(Boolean);
  }

  /** Removes every condition from the panel; Search and Reports to stay as they are. */
  async removeAllFilterConditions() {
    await this.openFilterPanel();
    const remove = this.page.getByRole("button", { name: "Remove filter" });
    // Removing the last row closes the panel.
    for (let i = 0; i < 10 && (await remove.count()) > 0; i++) {
      await remove.first().click();
    }
    await expect(this.page).not.toHaveURL(/compositeFilters=/);
    await this.waitForGrid();
  }
}
