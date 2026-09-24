import { expect } from "@playwright/test";
import { gotoWithRetry } from "../utils/navigation.js";

/**
 * TeamPage class handles interactions with the team page.
 */
export class TeamPage {
  /**
   * Initializes the TeamPage object.
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // Column Index Map
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

    // Header Filters
    this.searchInput = page.getByPlaceholder("Search members");
    this.reportsToDropdown = page.getByRole("combobox", { name: "Reports to" });
    this.employeeStatus = page.getByRole("button", { name: "Employee Status" });
    this.approvalStatus = page.getByRole("button", { name: "Approval Status" });
    this.approvalStatusSearchBar = page.getByPlaceholder("Approval Status");
    this.projectFilter = page.getByRole("button", { name: "Project" });
    // Filters moved into a query-builder panel behind one toolbar button, whose
    // label carries the active-condition count ("Filter" / "Filter 1").
    this.filterButton = page.getByRole("button", { name: /^Filter/ }).first();
    this.clearAllFiltersButton = page.getByRole("button", {
      name: "Clear all filters",
    });
    this.projectFilterSearchBar = page.getByPlaceholder("Project");

    //employeeStatus Filter Dialog
    this.selectEmpStatus = (empStatus) =>
      page.locator(`//div[@data-value="${empStatus}"]`);
    this.clearSelection = page.getByRole("button", { name: "Clear Selection" });

    // Prev & Next Buttons
    // Week paging was replaced by a stacked list of expandable week sections,
    // newest first: "This week", "Last week", then dated ranges. Only an
    // expanded section renders day headers, and expanding one does not collapse
    // the others.
    this.weekButton = (label) =>
      page
        .getByRole("button", {
          name: new RegExp(
            `^${String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          ),
        })
        .first();
    this.prevButton = page.getByRole("button", { name: "prev-week" });
    this.nextButton = page.getByRole("button", { name: "next-week" });

    // Reject Timesheet Modal. It replaces the review pane in the same dialog
    // rather than stacking on top, and is titled "Reason for timesheet
    // rejection" in an <h1> - there is no <h2> anywhere (and locator() has no
    // `name` option, so the old {name:...} was silently ignored, leaving a bare
    // "h2" that matched nothing and hung every caller).
    this.rejectTimesheetModal = page
      .getByRole("dialog")
      .filter({
        has: page.getByRole("heading", {
          name: "Reason for timesheet rejection",
        }),
      })
      .first();
    this.rejectReasonInput = page.getByPlaceholder(
      "Enter reason for rejection",
    );
    // "Reject" alone also matches this, so the confirm button needs exact.
    this.confirmRejectButton = page.getByRole("button", {
      name: "Reject timesheet",
      exact: true,
    });

    // Review Timesheet Pane
    // One object cannot carry three `has:` keys - only the last survived, so
    // this was really "any dialog with a Reject button". The pane renders no
    // <h2> at all now, so identify it by both actions instead, chained.
    this.reviewTimesheetPane = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("button", { name: "Approve" }) })
      .filter({ has: page.getByRole("button", { name: "Reject" }) })
      .first();

    // The grid has no table semantics at all - role=table, role=row and
    // role=cell every one resolve 0 - so rows and cells are addressed
    // structurally instead. A row is a flex container whose *direct children*
    // line up with dayIndexObj: child 0 is the label (member name + status),
    // children 1-7 are the seven day cells, child 8 is Total and child 9 is the
    // status / action slot. The header row of a week section has the same shape.
    // Depth is carried by the indentation class: pl-7.5 member, pl-13.5
    // project, pl-19.5 task.
    this.rowDepthClass = {
      member: "pl-7.5",
      project: "pl-13.5",
      task: "pl-19.5",
    };
    this.rowsIn = (section) =>
      section.locator("div.border-b.border-outline-gray-1");

    // Member rows. The team grid exposes no table semantics, so rows are
    // identified by the avatar that every member row renders (and week-group
    // rows do not).
    // Every week that holds data renders its own expanded section listing the
    // same members, so an unscoped row locator counts each member once per week
    // (12 rows for one member with 12 weeks of seeded data). Scope to the
    // current week's section so counts do not depend on how much history exists.
    this.weekSectionFor = (label) =>
      page
        .locator("div.animate-fade-in")
        .filter({
          has: page.getByRole("button", {
            name: new RegExp(
              `^${String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
            ),
          }),
        })
        .first();
    this.currentWeekSection = this.weekSectionFor("This week");
    this.employeeRows = this.currentWeekSection
      .locator("div.border-b.border-outline-gray-1")
      .filter({ has: page.locator("div.w-4.h-4.rounded-full") });

    // Project / task / time-off rows revealed when a member row is expanded.
    // The grid has no roles or test ids, so depth is identified by the
    // indentation class the UI applies per level (member pl-7.5, project
    // pl-13.5, task pl-19.5).
    this.employeeDetailRows = page.locator(
      'div.border-b.border-outline-gray-1[class*="pl-13.5"], div.border-b.border-outline-gray-1[class*="pl-19.5"]',
    );

    //Spinner
    this.spinner = page.locator("svg.animate-spin");

    // Employee Name in the table
    // No <p> elements in the redesigned grid - match the member name text.
    this.employeeNameInTable = (employeeName) =>
      page.getByText(employeeName, { exact: true }).first();

    //Toast Notification
    // Toasts render inside a live region and split their text across nested
    // elements, so an exact //div[text()=...] match never resolves. Match the
    // text inside the region instead (getByText does substring matching, which
    // is what survives the nesting and whitespace).
    this.toastNotification = (notificationMessage) =>
      page
        .getByRole("region", { name: /notification/i })
        .getByText(notificationMessage)
        .first();

    //Get locator with text
    this.visibleText = (text) => page.getByText(`${text}`);

    this.table = page.locator("header").first();
    this.filterElements = page.locator("#filters");
    this.saveChanges = page.getByRole("button", { name: "Save changes" });
  }

  // --------------------------------------
  // General
  // --------------------------------------

  /**
   * Navigates to the team page and waits for it to fully load.
   */
  /** Opens the team view for the configured reporting manager. */
  async goto() {
    await gotoWithRetry(
      this.page,
      `/next-pms/timesheet/team?reportsTo=${process.env.REP_MAN_ID}`,
    );
  }

  /**
   * Performs a search and selection within a modal based on a placeholder text.
   */
  async searchAndSelectOption(placeholder, value) {
    const searchInput = this.page
      .getByRole("dialog")
      .getByPlaceholder(`${placeholder}`);

    await searchInput.fill(value);
    await this.page.waitForTimeout(1000);
    await this.page.getByRole("option", { name: value }).click();
  }

  // --------------------------------------
  // Top Employee Search
  // --------------------------------------

  /**
   * Searches for an employee in the search input.
   */
  async searchEmployee(name) {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(1000);
    await this.searchInput.press("ArrowDown+Enter");
  }

  /**
   * Searches for a member and expands their row in place, revealing the
   * project / task breakdown of their timesheet. The redesigned Team view has
   * no per-employee timesheet page to navigate to.
   */
  async expandEmployeeRow(name) {
    await this.searchEmployee(name);

    // Scope the click to one week section: the member is listed once per week
    // that holds data, so an unscoped .first() expands whichever week happens
    // to come first in the DOM rather than the one under test.
    const section = await this.getEmployeeTimesheet(name);
    await section.getByText(name, { exact: true }).first().click();
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  /**
   * Labels of the project / task / time-off rows currently expanded.
   */
  async getEmployeeDetailRows() {
    const labels = [];

    for (const row of await this.employeeDetailRows.all()) {
      if (!(await row.isVisible())) continue;
      const label = await row.locator("span.truncate").first().textContent();
      labels.push(label.trim());
    }

    return labels;
  }

  // --------------------------------------
  // Top Reports To Selection Dropdown
  // --------------------------------------

  /**
   * Applies the 'Reports To' filter by selecting an employee from the dropdown.
   */
  async applyReportsTo(name) {
    // "Reports to" is a combobox with inline options - there is no modal.
    await this.reportsToDropdown.click();
    await this.reportsToDropdown.fill(name);
    await this.page.waitForTimeout(1000);
    await this.page.getByRole("option", { name }).first().click();
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  // --------------------------------------
  // Prev & Next Buttons
  // --------------------------------------

  /**
   * Clicks on the prev button.
   */
  /**
   * Reads a member's approval status straight from their row.
   *
   * Approval status is no longer a table cell - it renders as the second line of
   * the member's row ("Renish Employee | Approval pending | 04:30 | ..."), and
   * the page has no cell/row roles, so getCell() cannot reach it.
   */
  async getApprovalStatusFromRow(employeeName) {
    const row = this.employeeRows.filter({ hasText: employeeName }).first();
    await row.waitFor({ state: "visible", timeout: 20000 });

    const lines = ((await row.innerText()) || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      lines.find((line) =>
        /^(Not submitted|Approval pending|Approved|Rejected|Partially)/i.test(
          line,
        ),
      ) ?? null
    );
  }

  /**
   * Week section labels in display order, newest first.
   */
  async getWeekLabels() {
    // goto() only waits for domcontentloaded, and the week list renders after
    // its data fetch, so wait for the current week before enumerating - reading
    // too early returns an empty list and callers end up with an undefined label.
    await this.weekButton("This week").waitFor({
      state: "visible",
      timeout: 20000,
    });

    return await this.page
      .getByRole("button")
      .evaluateAll((els) =>
        els
          .map((el) =>
            (el.getAttribute("aria-label") || el.innerText || "")
              .split("\n")[0]
              .trim(),
          )
          .filter((text) =>
            /^(This week|Last week|[A-Z][a-z]{2} \d{1,2} -)/.test(text),
          ),
      );
  }

  /**
   * Which week sections are currently expanded, newest first.
   */
  async getOpenWeekLabels() {
    const labels = await this.getWeekLabels();
    const open = [];

    for (const label of labels) {
      if (
        (await this.weekButton(label).getAttribute("aria-expanded")) === "true"
      ) {
        open.push(label);
      }
    }

    return open;
  }

  /**
   * Expands or collapses one week section.
   */
  async toggleWeek(label, expanded) {
    if (!label) {
      throw new Error(
        "toggleWeek: no week label resolved - the week list did not render in time.",
      );
    }

    const button = this.weekButton(label);
    await button.waitFor({ state: "visible", timeout: 15000 });

    if (
      ((await button.getAttribute("aria-expanded")) === "true") !==
      expanded
    ) {
      // Row overlays swallow pointer events, so target the control directly.
      await button.dispatchEvent("click");
      await this.page.waitForTimeout(1200);
    }
  }

  /**
   * Clicks on the previous button.
   */
  async viewPreviousWeek() {
    // Going back a week now means opening the next older section in the list.
    const labels = await this.getWeekLabels();
    const open = await this.getOpenWeekLabels();
    const oldestOpen = open.length ? labels.indexOf(open[open.length - 1]) : 0;

    await this.toggleWeek(
      labels[Math.min(oldestOpen + 1, labels.length - 1)],
      true,
    );
  }

  /**
   * Clicks on the next button.
   */
  async viewNextWeek() {
    // The list runs from the current week backwards - there is no future week -
    // so advancing means collapsing the oldest open section to step back toward
    // the present. With only the current week open there is nothing newer to
    // move to, which is a no-op rather than an error.
    const open = await this.getOpenWeekLabels();

    if (open.length <= 1) {
      return;
    }

    await this.toggleWeek(open[open.length - 1], false);
  }

  // --------------------------------------
  // Reject Timesheet Modal
  // --------------------------------------

  /**
   * Rejects the timesheet of a specified employee.
   */
  async rejectTimesheet({ employee, reason, notification }) {
    await this.openReviewTimesheetPane(employee);
    await this.actOnTimeEntry("Reject");

    await this.rejectTimesheetModal.waitFor({
      state: "visible",
      timeout: 20000,
    });
    await this.rejectReasonInput.fill(reason);
    await this.confirmRejectButton.click();
    await this.toastNotification(notification).waitFor({
      state: "visible",
      timeout: 20000,
    });

    // Wait until the row reports a rejected state. The status is the aria-label
    // of the status column's button now - the old check read an svg's
    // stroke-destructive class, which the icon no longer carries.
    await expect
      .poll(async () => await this.getTimesheetStatus(employee), {
        timeout: 30000,
      })
      .toMatch(/rejected/i);
  }

  // --------------------------------------
  // Review Timesheet Pane
  // --------------------------------------

  /**
   * Checks if the 'Review Timesheet' pane is visible.
   */
  async isReviewTimesheetPaneVisible() {
    return await this.reviewTimesheetPane.isVisible();
  }

  /**
   * Opens the 'Review Timesheet' pane for a specified employee.
   */
  async openReviewTimesheetPane(employee) {
    // The status column holds an icon-only button whose aria-label is the
    // status text ("Not submitted", "Partially rejected", ...); clicking it
    // opens the review pane. The cell itself is not the click target.
    const cell = await this.getCell({
      employee: employee,
      rowName: "employee header",
      col: "status",
    });
    const trigger = cell.getByRole("button").first();
    await trigger.waitFor({ state: "visible", timeout: 20000 });
    await trigger.click();
    await this.reviewTimesheetPane.waitFor({
      state: "visible",
      timeout: 20000,
    });
  }

  /**
   * Retrieves the time entry section for the specified date.
   */
  async getTimeEntrySection(date) {
    return this.reviewTimesheetPane.locator(
      `//p[contains(text(),'${date}')]/parent::div/parent::div`,
    );
  }

  /**
   * Retrieves the time entry row for the specified metadata.
   */
  async getTimeEntryRow({ date, project, task, desc }) {
    // Entries are flex rows inside the day's accordion panel. The old XPath
    // keyed off <p>/<span> tags and a preceding-sibling date <p>; the date is a
    // button now and the tags no longer line up, so match on the text the row
    // actually shows - task, project and description are all inside it.
    //
    // `date` is accepted for signature compatibility but not needed to
    // disambiguate: task + description is unique per seeded entry.
    let entry = this.reviewTimesheetPane.locator(
      'div[class*="px-3.5"][class*="py-4"][class*="gap-3"]',
    );

    for (const text of [task, project, desc]) {
      if (text) entry = entry.filter({ hasText: text });
    }

    return entry.first();
  }

  /**
   * Toggles time entry selection
   */
  async toggleTimeEntrySelection(date) {
    const section = await this.getTimeEntrySection(date);
    await section.getByRole("checkbox").check();
  }

  /**
   * Updates duration of the specified time entry.
   */
  async updateDurationOfTimeEntry({ date, project, task, desc, newDuration }) {
    const row = await this.getTimeEntryRow({
      date: date,
      project: project,
      task: task,
      desc: desc,
    });
    await row.waitFor({ state: "visible", timeout: 20000 });

    // Editing happens inline, and the pencil only exists on hover ("opacity-0
    // pointer-events-none" until then). It is also disabled for entries that
    // are already approved or rejected - only a pending one can be changed.
    await row.hover();
    const editButton = row
      .getByRole("button", { name: "Edit time entry" })
      .first();
    await editButton.waitFor({ state: "visible", timeout: 15000 });

    if (!(await editButton.isEnabled())) {
      throw new Error(
        `updateDurationOfTimeEntry: the "Edit time entry" control is disabled for "${task}". ` +
          `Only a pending entry can be edited - an approved or rejected one cannot.`,
      );
    }
    await editButton.click();

    // The duration field appears in place, carrying a "00:00" placeholder. It is
    // a masked time field backed by a second, hidden input holding minutes, and
    // it only commits the typed value to component state on **blur** - without
    // that the display shows the new value while the save still posts the old
    // one (seen as hours:0.5 after filling "01:45"). pressSequentially is worse
    // still: it appends rather than replaces ("014500:30"), and Control+A does
    // not select inside the mask.
    const duration = row.getByPlaceholder("00:00");
    await duration.waitFor({ state: "visible", timeout: 15000 });
    await duration.fill(newDuration);
    await duration.blur();
    await this.page.waitForTimeout(800);

    // Confirm with the green tick; the grey one beside it cancels. The tick
    // needs dispatchEvent - a normal click lands on it (it is unobstructed and
    // enabled) but fires no request at all.
    await row
      .getByRole("button")
      .filter({ has: this.page.locator("svg.text-ink-green-4") })
      .first()
      .dispatchEvent("click");
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
  }

  /**
   * Performs an action on a time entry by clicking the corresponding button.
   */
  async actOnTimeEntry(action) {
    await this.reviewTimesheetPane
      .getByRole("button", { name: action })
      .click();
  }

  // --------------------------------------
  // Parent Table Actions
  // --------------------------------------

  /**
   * Retrieves the header row from the parent table.
   */
  async getHeaderRow() {
    // The week section's own first row carries the day labels. It is the only
    // row with no pl-* indentation class, and depth lives in the row's own
    // class, so exclude the indented ones with :not() rather than filter().
    return this.currentWeekSection
      .locator(
        'div.border-b.border-outline-gray-1:not([class*="pl-7.5"]):not([class*="pl-13.5"]):not([class*="pl-19.5"])',
      )
      .first();
  }

  /**
   * Retrieves all employee rows from the parent table.
   */
  async getEmployeeRows() {
    await this.employeeRows
      .first()
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {
        // no members matched the current filters
      });

    return this.employeeRows;
  }

  /**
   * Retrieves a list of employee names from the parent table.
   */
  async getEmployees() {
    const employees = [];
    // Wait up to 10s for spinner to appear and disappear (if it appears at all)
    try {
      if (await this.spinner.isVisible({ timeout: 1000 })) {
        await this.spinner.waitFor({ state: "hidden", timeout: 10000 });
      }
    } catch {
      // Spinner never appeared – ignore
    }
    await this.page.waitForTimeout(2000);
    const rows = await this.getEmployeeRows();

    for (const row of await rows.all()) {
      const employee = await row
        .locator("span.font-medium.truncate")
        .first()
        .textContent();
      employees.push(employee.trim());
    }

    return employees;
  }

  /**
   * Checks if the timesheet of the specified employee is visible.
   */
  async isEmployeeTimesheetVisible(name) {
    // Expanding a member reveals their project / task breakdown inline; there
    // is no nested table to look for any more.
    await this.employeeDetailRows
      .first()
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {});

    return (await this.getEmployeeDetailRows()).length > 0;
  }

  /**
   * Retrieves the timesheet element for a specific employee.
   */
  async getEmployeeTimesheet(name, weekLabel = "This week") {
    // There is no per-employee wrapper element: a member row and its project /
    // task rows are siblings inside a week section. The section is the real
    // container, so that is what callers get scoped to.
    //
    // It has to be a *single* week. Every week holding data renders its own
    // section listing the same members, so the old page-wide lookup now matches
    // the employee once per week (12 times for 12 weeks of history).
    const section = this.weekSectionFor(weekLabel);
    await section.waitFor({ state: "visible", timeout: 20000 });
    await section
      .getByText(name, { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 20000 });

    return section;
  }

  /**
   * Toggles the timesheet view for a specific employee.
   */
  async toggleEmployeeTimesheet(name) {
    await this.expandEmployeeRow(name);
  }

  /**
   * Retrieves the timesheet status of a given employee by analyzing the status icon's class attributes.
   */
  async getTimesheetStatus(name) {
    // The status is the aria-label of the status column's icon-only button -
    // the old approach read an svg's stroke-* class, and the icon no longer
    // carries the status that way.
    const cell = await this.getCell({
      employee: name,
      rowName: "employee header",
      col: "status",
    });
    const label = await cell
      .getByRole("button")
      .first()
      .getAttribute("aria-label");

    return (label || "").trim();
  }

  /**
   * Retrieves a row from the timesheet based on employee name and row type.
   * Returns header row of the parent table when employee name is not specified.
   */
  async getRow({ employee, rowName }) {
    if (!employee) {
      return this.getHeaderRow();
    }

    const section = await this.getEmployeeTimesheet(employee);
    const rows = this.rowsIn(section);

    switch (rowName.toLowerCase()) {
      case "employee header":
        // The member's own row. Depth lives in the row's *own* class, so select
        // on it directly - filter({hasNot}) inspects descendants, not self.
        return section
          .locator(
            `div.border-b.border-outline-gray-1[class*="${this.rowDepthClass.member}"]`,
          )
          .filter({ hasText: employee })
          .first();
      case "time off":
        return rows.filter({ hasText: /Time-?off/i }).first();
      default:
        // A project or task row, addressed by its label.
        return rows.filter({ hasText: rowName }).first();
    }
  }

  /**
   * Retrieves a specific cell from the timesheet based on employee, row, and column.
   */
  async getCell({ employee, rowName, col }) {
    const row = await this.getRow({ employee: employee, rowName: rowName });
    await row.waitFor({ state: "visible", timeout: 20000 });

    const colIndex = this.dayIndexObj[col.toLowerCase()];
    if (colIndex === undefined) {
      throw new Error(
        `getCell: unknown column "${col}". Known: ${Object.keys(this.dayIndexObj).join(", ")}`,
      );
    }
    // Direct children only - the row's own flex columns.
    const cell = row.locator("> div").nth(colIndex);

    await cell.waitFor({ state: "visible", timeout: 20000 });
    return cell;
  }

  /**
   * Retrieves the text content of a specified cell.
   */
  async getCellText(cellInfo) {
    const cell = await this.getCell(cellInfo);

    return (await cell.isVisible()) ? await cell.textContent() : "-";
  }

  /**
   * Retrieves the tooltip text of a specified cell.
   */
  async getCellTooltipText(cellInfo) {
    const cell = await this.getCell(cellInfo);
    const tooltip = cell.locator("//div[@data-radix-popper-content-wrapper]");

    await cell.hover();
    await tooltip.waitFor({ state: "visible" });

    return (await tooltip.isVisible()) ? await tooltip.textContent() : "";
  }

  /**
   * Retrieves the date of a specific parent table column.
   */
  async getColDate(col) {
    // Day headers now live inside each expanded week section as lines of its
    // button ("This week | Aug 31 | ... | Sep 6 | Total"). Callers compare the
    // result against getDateForWeekday(), i.e. the current week, so read the
    // newest section. Filtering to date-shaped lines keeps the offset correct
    // even when a section also carries a badge line such as
    // "· 1 pending approval".
    const labels = await this.getWeekLabels();

    if (!labels.length) {
      return "-";
    }

    const currentWeek = labels[0];
    await this.toggleWeek(currentWeek, true);

    const days = ((await this.weekButton(currentWeek).innerText()) || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^[A-Z][a-z]{2} \d{1,2}$/.test(line));

    const offset = this.dayIndexObj[col.toLowerCase()] - this.dayIndexObj.mon;

    return days[offset] ?? "-";
  }

  // --------------------------------------
  // Task Details Dialog
  // --------------------------------------

  /**
   * Opens the details dialog of a specified task.
   */
  async openTaskDetails({ employee, task }) {
    const section = await this.getEmployeeTimesheet(employee);
    // The task label is plain text inside the task row, so match the text
    // rather than a <span> XPath - the markup carries no stable element for it.
    const label = section.getByText(task, { exact: true }).first();
    await label.waitFor({ state: "visible", timeout: 20000 });
    await label.click();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Checks if the task details dialog with the specified name is visible.
   */
  async isTaskDetailsDialogVisible(name) {
    // The dialog carries no accessible name, so match on the task it shows.
    const dialog = this.page
      .getByRole("dialog")
      .filter({ hasText: name })
      .first();
    await dialog.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});

    return await dialog.isVisible().catch(() => false);
  }
  /**
   * Wait for Spinner to disappear
   */
  async waitForSpinnerTodisappear() {
    // Wait for spinner to disappear
    if (await this.spinner.isVisible().catch(() => false)) {
      await this.spinner.waitFor({ state: "hidden" });
    }
  }

  /**
   * Select suggestion for Employee Status
   */
  async selectEmployeeStatus(empStatus) {
    await this.employeeStatus.click();
    await this.selectEmpStatus(empStatus).click();
    await this.waitForSpinnerTodisappear();
  }

  /**
   * Check and apply Employee Status filter
   */
  async checkEmployeeStatus(empStatus) {
    // "Employee Status" is now the "Member Status" field of the filter panel.
    await this.addFilterCondition("Member Status", empStatus);
  }
  /**
   * Check and apply Approval Status filter
   */
  async checkApprovalStatus(approvalStatus) {
    await this.approvalStatus.click();
    await this.page.getByText(approvalStatus, { exact: true }).click();
    await this.approvalStatusSearchBar.press("Escape");
  }

  /**
   * Check and apply Project  filter
   */
  async checkProjectStatus(projectName) {
    await this.addFilterCondition("Project", projectName);
  }
  /**
   * Check and apply User Group filter
   */
  async checkBusinessUnit(businessUnit) {
    // Applied on top of another condition (TC95 pairs it with Project), so this
    // needs its own row - writing into the last one would overwrite whatever is
    // already there. Detected from the panel rather than assumed, so it still
    // behaves if it is ever the only filter.
    //
    // Deliberately decided here and not inside addFilterCondition: that must
    // keep overwriting the last row by default, because TC91 calls
    // checkEmployeeStatus in a loop and depends on each status *replacing* the
    // previous one. Auto-adding there would build "Status = A AND Status = B",
    // which matches nobody.
    const lastValue = await this.page
      .getByPlaceholder("Value")
      .last()
      .inputValue()
      .catch(() => "");

    // Business Unit, not Project Type: this page's panel offers exactly
    // Project, Task, Date, Member, Member Status and Business Unit - typing
    // "Project Type" returns zero options and hangs the field lookup.
    await this.addFilterCondition(
      "Business Unit",
      businessUnit,
      lastValue !== "",
    );
  }

  /**
   * Check and apply User Group filter.
   *
   * The "User Group" control no longer exists: this page's filter panel offers
   * Project, Task, Date, Member, Member Status and Business Unit only, and no
   * user-group control exists anywhere on the timesheet or allocations team
   * pages. Kept because the skipped TC94 still references it - it will time out
   * if called.
   */
  async checkUserGroup(userGroupName) {
    await this.page.getByRole("button", { name: "User Group" }).click();
    await this.page
      .getByRole("option", { name: userGroupName })
      .getByRole("checkbox")
      .check();
    await this.page.getByPlaceholder("User Group").press("Escape");
  }

  /**
   * Verify if filters are applied
   */
  async isFilterApplied() {
    // Per-field filter chips are gone; the toolbar button now carries the count
    // of active conditions ("Filter" with none, "Filter 1" with one).
    await this.filterButton.waitFor({ state: "visible", timeout: 20000 });

    return /\d/.test((await this.filterButton.innerText()) || "");
  }

  /**
   * The field names currently in the filter panel, e.g. ["Project", "Business Unit"].
   *
   * More useful than the count badge for asserting *which* filters are live:
   * the badge's treatment of the blank row the panel re-seeds is inconsistent,
   * so an exact count is a brittle thing to assert on.
   */
  async getAppliedFilterFields() {
    if (
      !(await this.page
        .getByPlaceholder("Field")
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await this.filterButton.click();
      await this.page.waitForTimeout(1000);
    }

    const values = await this.page
      .getByPlaceholder("Field")
      .evaluateAll((els) => els.map((e) => e.value));

    return values.map((v) => (v || "").trim()).filter(Boolean);
  }

  /**
   * Removes every applied filter condition, one at a time.
   *
   * Use this - not clearFilters() - when a test needs filters genuinely gone.
   * The panel's "Clear all filters" button empties the condition rows without
   * committing, so the badge and the grid keep the old filter. The per-row
   * "Remove filter" button does commit.
   *
   * Matters for ordering: a worker reuses one browser context across the tests
   * in a file, so the app carries its filter state from one test into the next.
   * A test that asserts an exact filter count has to start from a known state.
   */
  async removeAllFilterConditions() {
    if (
      !(await this.page
        .getByPlaceholder("Field")
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await this.filterButton.click();
      await this.page.waitForTimeout(1000);
    }

    // Each click drops a row, so re-read rather than caching the count. Capped
    // rather than looped on, since the panel re-seeds a blank row.
    for (let i = 0; i < 10 && (await this.getAppliedFilterCount()) > 0; i++) {
      const remove = this.page.getByRole("button", { name: "Remove filter" });
      if ((await remove.count()) === 0) break;
      await remove.first().click();
      await this.page
        .waitForLoadState("networkidle", { timeout: 5000 })
        .catch(() => {});
      await this.page.waitForTimeout(400);
    }
  }

  /**
   * Reads the count badge on the Filter button ("Filter\n2" -> 2), so a test can
   * assert how many conditions are live rather than just that some are. The
   * badge is absent when nothing is applied, which reads as 0.
   */
  async getAppliedFilterCount() {
    await this.filterButton.waitFor({ state: "visible", timeout: 20000 });
    const match = ((await this.filterButton.innerText()) || "").match(/(\d+)/);

    return match ? Number(match[1]) : 0;
  }

  /**
   * Clear Applied filters
   */
  async clearFilters() {
    // One "Clear all filters" control inside the filter panel replaced the
    // per-field clear icons, so open the panel if it is not already showing.
    if (!(await this.clearAllFiltersButton.isVisible().catch(() => false))) {
      await this.filterButton.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    if (await this.clearAllFiltersButton.count()) {
      await this.clearAllFiltersButton.first().click();
      await this.page.waitForTimeout(1200);
    }
  }

  /**
   * Updates and saves a view
   */
  async saveNewView(employeeName) {
    const filterApplied = await this.isFilterApplied();
    if (filterApplied) {
      await this.clearFilters();
      await this.saveChanges.click();
      await this.goto();
    }
    await this.applyReportsTo(employeeName);
    await this.selectEmployeeStatus("Active");
    await this.saveChanges.click();
  }

  /**
   * Adds one "<Field> Equals <Value>" condition to the page's filter panel.
   * Per-field filter buttons were replaced by a query-builder
   * ("Where <Field> <Operator> <Value>"); conditions are ANDed.
   */
  async addFilterCondition(fieldLabel, value, needsNewRow = false) {
    const fieldInput = this.page.getByPlaceholder("Field");

    if (
      !(await fieldInput
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await this.page.getByRole("button", { name: "Filter" }).first().click();
    }
    if (needsNewRow) {
      await this.page.getByText("Add filter").click();
      await this.page.waitForTimeout(700);
    }
    const exact = (t) =>
      new RegExp(`^${String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    const field = fieldInput.last();
    await field.click();
    await field.fill(fieldLabel);
    await this.page
      .getByRole("option", { name: exact(fieldLabel) })
      .first()
      .click();

    // Operator wording varies by field type ("Equals"/"Not Equals" for links,
    // "is"/"is not" for selects) - the affirmative option is always first.
    const operator = this.page.getByPlaceholder("Operator").last();
    await operator.click();
    await this.page.waitForTimeout(600);
    await this.page.getByRole("option").first().click();

    const valueInput = this.page.getByPlaceholder("Value").last();
    await valueInput.click();
    await valueInput.fill(value).catch(() => {});
    await this.page.waitForTimeout(900);

    // Prefer an exact option; fall back to a contains match, since some env
    // values are shorter than the label shown (e.g. "Renish" -> "Renish PM").
    let option = this.page.getByRole("option", { name: exact(value) }).first();
    if ((await option.count()) === 0) {
      option = this.page.getByRole("option", { name: value }).first();
    }
    await option.waitFor({ state: "visible", timeout: 10000 });
    await option.click();

    // Bounded on purpose - as is every networkidle wait in the suite. The app
    // holds a socket.io connection open, so "no requests for 500ms" can simply
    // never happen, and an unbounded wait then consumes the whole 30s test
    // budget: that is what took TC93 out on an otherwise healthy run. The
    // option click has already committed the condition, so this is a settle,
    // not a barrier - where a read genuinely needs a barrier, wait on the list
    // response instead (see ProjectPage.waitForProjectList).
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
  }
}
