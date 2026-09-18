import { expect } from "@playwright/test";
import { getFormattedCurrentDate } from "../../utils/dateUtils";

// Callers pass either an ISO date from getFormattedDate ("2026-09-01") or a
// year-less short date from the other date utils ("Sep 3"). The short form has
// to be resolved against the year that places it nearest today.
const parseShortDate = (formatted) => {
  const today = new Date();

  const iso = String(formatted).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const candidates = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]
    .map((year) => new Date(`${formatted}, ${year}`))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (!candidates.length) {
    throw new Error(`addDateRange: could not parse date "${formatted}"`);
  }

  return candidates.reduce((best, date) => (Math.abs(date - today) < Math.abs(best - today) ? date : best));
};

export class TimelinePage {
  constructor(page) {
    this.page = page;
    this.currentDate = new Date();
    this.dayOfWeek = this.currentDate.toLocaleDateString("en-US", { weekday: "short" }); // Thu
    this.formattedDate = getFormattedCurrentDate(); // June 12

    // header elements
    this.addAllocatioButtton = page.getByRole("button", { name: "Add allocation" });
    this.searchEmployeeFilter = page.getByPlaceholder("Search members");
    // The Project tab searches by project, the Team tab by member.
    this.searchProjectFilter = page.getByPlaceholder("Search project");
    // Allocation chips in the grid; opening one reveals Edit/Delete actions.
    this.allocationChip = page.getByRole("button", { name: "Allocation summary" });
    this.deleteAllocationAction = page.getByRole("button", { name: "Delete allocation" });
    this.editAllocationAction = page.getByRole("button", { name: "Edit allocation" });
    // The old per-chip clear icons lived in a "div#filters" strip that the
    // redesign removed. Clearing now happens inside the filter panel: an
    // icon-only "Clear all filters" button, plus one "Remove filter" per
    // condition row. Both are unlabelled visually and only carry aria-labels.
    // Both allocations grids render a quarter of week columns and step by
    // quarter; the per-week controls the tests used to drive are gone.
    this.prevQuarterButton = page.getByRole("button", { name: "Previous Quarter" });
    this.nextQuarterButton = page.getByRole("button", { name: "Next Quarter" });
    // One week-range label per column, e.g. "Sep 7 - 13".
    this.weekRangeSpans = page.locator("thead th span.truncate");
    // Day numbers sit a level deeper than they used to, so match on content.
    this.dayHeaderSpans = page.locator("thead th span").filter({ hasText: /^\d+$/ });
    this.filterPanelButton = page.getByRole("button", { name: /^Filter/ }).first();
    this.clearAllFiltersButton = page.getByRole("button", { name: "Clear all filters" });
    this.removeFilterButtons = page.getByRole("button", { name: "Remove filter" });

    //add allocation modal elements
    // The dialog is now: three comboboxes (Project / Customer / Employee), a
    // One time / Recurring toggle, a single start-and-end date range, hours per
    // day, a non-billable checkbox and a note. Submit is "Allocate".
    this.modalErrorMessage = page.locator("p[id*='form-item-message']");
    this.allocationDialog = page.getByRole("dialog");
    this.selectEmployeeDropdown = page.getByPlaceholder("Select Employee");
    this.selectEmployeeTextField = page.getByPlaceholder("Select Employee");
    this.employeeSelector = page.getByLabel("Suggestions");
    this.customerDropdown = page.getByPlaceholder("Select Customer");
    this.projectDropdown = page.getByPlaceholder("Select Project");
    this.allocateButton = page.getByRole("button", { name: "Allocate", exact: true });
    // "Hours / day" is a masked duration input ("00:00") carrying no id - the
    // label's `for="hours-per-day"` points at nothing - so the placeholder is
    // what identifies it. Exactly one exists on the page while the dialog is
    // open. See setHoursPerDay for why fill() alone does not commit it.
    this.hoursPerDayField = page.getByPlaceholder("00:00");
    this.dateRangeField = page.getByRole("textbox").filter({ hasText: /-/ }).first();
    // Billability is a "Mark as non-billable" checkbox, not a toggle switch.
    this.billableToggle = page.getByLabel("Mark as non-billable");
    this.startDateSelector = page.locator(
      'div[data-state="open"] form > div:nth-child(3) div:nth-child(1) > div:nth-child(2) button',
    );
    this.endDateSelector = page.locator(
      'div[data-state="open"] form > div:nth-child(3) div:nth-child(2) > div:nth-child(2) button',
    );
    this.startDateWithToday = page
      .locator("div")
      .filter({ hasText: /^Start Date\*Today$/ })
      .getByRole("button");
    this.endDateWithToday = page
      .locator("div")
      .filter({ hasText: /^End Date\*Today$/ })
      .getByRole("button");
    // The dialog's fields carry stable ids, which survive restyling better than
    // placeholder or role lookups.
    this.totalHoursTextField = page.locator("#total-hours");
    this.noteField = page.getByPlaceholder("Add a note");
    this.createButton = page.getByRole("button", { name: "Allocate", exact: true });
    this.saveButton = page.getByRole("button", { name: "Save Changes", exact: true });

    // "Start and end date" is a read-only input that opens a one-month calendar.
    this.dateRangeInput = page.locator("#date-range");
    this.calendarPrevMonth = page.getByRole("button", { name: "Previous month" });
    this.calendarNextMonth = page.getByRole("button", { name: "Next month" });
    this.calendarCaption = page
      .locator("span")
      .filter({ hasText: /^[A-Z][a-z]{2} \d{4}$/ })
      .first();
    // The month grid spills the adjacent months, so days 1-3 and 28-31 can each
    // appear twice. The leading spill is the previous month's tail and the
    // trailing spill the next month's head, so an early day is the first match
    // and a late day the last - no dependence on the muted-text styling.
    this.calendarDayCell = (dayNumber) => {
      const cells = page.getByRole("grid").getByRole("gridcell", { name: String(dayNumber), exact: true });

      return dayNumber <= 15 ? cells.first() : cells.last();
    };

    // Checkboxes are unnamed inputs paired with a visible label.
    this.nonBillableCheckbox = page.getByLabel("Mark as non-billable");
    this.tentativeCheckbox = page.getByLabel("Mark as tentative");

    this.deleteAllocationIcon = page.locator(".rct-item ").first();
    this.confirmDeleteButton = page.getByRole("button", { name: "Delete", exact: true });
    this.timeAllocationRow = page.locator(".rct-hl-even");
    this.formattedDate = getFormattedCurrentDate();
    this.clearFilterIcon = page.getByRole("button", { name: "Clear search" });
  }

  /**
   * Navigates to the timeline page and waits for it to fully load.
   */
  async goto() {
    // The Timeline view was removed in the redesign (/allocations/timeline now
    // 404s). The same "Add allocation" workflow lives on the Project tab, so
    // tests that only need the allocation dialog land here instead.
    // ProjectPage and TeamPage override this with their own routes.
    await this.page.goto("/next-pms/allocations/project", { waitUntil: "domcontentloaded" });
  }

  /**
   * Checks if the timesheet page is visible.
   */
  async isPageVisible() {
    await this.addAllocatioButtton.isVisible();
  }
  /**
   * Clicks the "Add Allocation" button.
   */
  async clickAddAllocationButton() {
    await this.addAllocatioButtton.click();
  }

  /**
   * Selects an employee from the dropdown.
   */
  async selectEmployee(employeeName) {
    await this.pickFromCombobox(this.selectEmployeeDropdown, employeeName);
  }

  /**
   * Picks a value from one of the allocation dialog's comboboxes.
   */
  async pickFromCombobox(input, value) {
    await input.click();
    await input.fill(value);

    // Wait for the searched option itself rather than padding with a fixed
    // sleep: each of these dialogs picks three values, and the old 1000ms +
    // 500ms per field pushed the whole flow close to the 30s test timeout.
    const option = this.page.getByRole("option", { name: value }).first();
    await option.waitFor({ state: "visible", timeout: 15000 });
    await option.click();
    await option.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  /**
   * Selects a customer from the dropdown.
   */
  async selectCustomer(customerName) {
    // Customer is derived from the selected Project and is rendered read-only,
    // so there is nothing to pick once a project is chosen.
    if (!(await this.customerDropdown.isEditable().catch(() => false))) {
      return;
    }
    await this.pickFromCombobox(this.customerDropdown, customerName);
  }

  /**
   * Selects a project from the dropdown.
   */
  async selectProject(customerName, projectName) {
    // The project combobox is no longer scoped by customer name.
    await this.pickFromCombobox(this.projectDropdown, projectName);
  }

  /**
   * Selects a date range for the allocation.
   */
  async addDateRange(formattedDate = this.formattedDate) {
    // The dialog has a single "Start and end date" range that already defaults
    // to today, so an allocation for today needs no interaction at all. Compare
    // parsed dates rather than strings, since callers pass either format.
    if (!formattedDate) {
      return;
    }

    const target = parseShortDate(formattedDate);
    if (target.toDateString() === new Date().toDateString()) {
      return;
    }
    await this.dateRangeInput.click();
    await this.page.getByRole("grid").waitFor({ state: "visible", timeout: 10000 });

    // Walk to the target month. Every caller allocates within a few days of
    // today, so this usually does not iterate at all.
    const wantedCaption = target.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    for (let step = 0; step < 24; step++) {
      const caption = (await this.calendarCaption.textContent())?.trim();

      if (caption === wantedCaption) {
        break;
      }

      const shownMonth = new Date(`${caption} 1`);
      await (shownMonth > target ? this.calendarPrevMonth : this.calendarNextMonth).click();
      await this.page.waitForTimeout(300);
    }

    // Clicking the same day twice sets an identical start and end, which is the
    // single-day allocation every caller wants. The calendar dismisses itself
    // once the range is complete - never press Escape here, as that closes the
    // whole allocation dialog and the submit then has nothing to send.
    const dayCell = this.calendarDayCell(target.getDate());
    await dayCell.click();
    await this.page.waitForTimeout(400);
    await dayCell.click();
    await this.page
      .getByRole("grid")
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
  }

  /**
   * Sets the number of hours per day for the allocation.
   */
  async setHoursPerDay(hours = "8") {
    // Two separate traps live in this one field.
    //
    // It lost the id this used to target: the label still renders
    // `for="hours-per-day"` but no element carries that id any more, so
    // `#hours-per-day` matched nothing and fill() hung for the whole 30s test
    // budget - which is what took out all nine allocation tests at once.
    //
    // And it is a masked duration input, so fill() only puts the raw text in
    // the box ("8"); the value normalises to "08:00" and reaches the form - and
    // the derived Total hours - on blur. Without the blur the allocation posts
    // whatever the field held before. Values over the employee's daily capacity
    // are clamped here rather than rejected (25 commits as 08:00), which is the
    // behaviour TC111 asserts against.
    const field = this.hoursPerDayField.first();
    await field.fill("");
    await field.fill(String(hours));
    await field.blur();
    // Self-check that the mask committed - an uncommitted value stays as typed.
    await expect(field).toHaveValue(/^\d{1,2}:\d{2}$/);
  }

  /**
   * Sets a note for the allocation.
   */
  async setNote(note) {
    await this.noteField.fill(note);
  }

  /**
   * Clicks the "Create" button to create the allocation.
   */
  async clickCreateButton() {
    await this.createButton.click();
  }

  /**
   * Clicks the "Save" button to save an allocation.
   */
  async clickSaveButton() {
    await this.saveButton.click();
  }

  /**
   * Filters the employee list by the given name.
   */
  async filterEmployeeByName(employeeName) {
    await this.searchEmployeeFilter.fill(employeeName);
    await this.page.keyboard.press("Enter");
  }

  /**
   * Filters the Project tab's grid down to one project.
   */
  async filterByProjectName(projectName) {
    await this.searchProjectFilter.fill(projectName);
    await this.page.waitForTimeout(1500);
  }

  /**
   * Opens the popover of an allocation chip in the grid.
   * Callers filter the grid to a single project/member first, so the first chip
   * is the one under test.
   */
  async openAllocationPopover() {
    await this.page.waitForTimeout(1000);
    await this.allocationChip.first().click();
    await this.page.waitForTimeout(1200);
  }

  /**
   * Opens an allocation's edit dialog via its chip popover.
   */
  async openEditAllocationDialog() {
    await this.openAllocationPopover();
    await this.editAllocationAction.first().click();
    await this.allocationDialog.waitFor({ state: "visible", timeout: 15000 });
    await this.page.waitForTimeout(800);
  }

  /**
   * Delete the allocation added.
   */
  async deleteAllocation(projectName) {
    // Allocations are chips in the grid; clicking one opens a popover whose
    // actions are labelled "Edit allocation" / "Delete allocation".
    await this.allocationChip.first().click();
    await this.page.waitForTimeout(1200);
    await this.deleteAllocationAction.first().click();
    await this.page.waitForTimeout(800);

    if (await this.confirmDeleteButton.isVisible().catch(() => false)) {
      await this.confirmDeleteButton.click();
    }
  }

  /**
   * Adds a new allocation.
   */
  async addAllocation(projectName, customerName, employeeName, date, hoursPerDay = "8") {
    await this.clickAddAllocationButton();

    // Project comes first in the redesigned dialog: Customer is derived from it
    // and the remaining fields only enable once a project is chosen.
    //
    // The two lists scope each other - pick a project and the Employee list
    // narrows to that project's assigned members (20 -> 4); pick an employee
    // first and the Project list narrows to theirs. So reordering does not help
    // when the seeded project is not shared with the employee under test; the
    // share has to name that employee. See payloadShareProject in the data.
    await this.selectProject(customerName, projectName);
    await this.selectCustomer(customerName);
    await this.selectEmployee(employeeName);
    await this.addDateRange(date);
    await this.setHoursPerDay(hoursPerDay);

    // Wait for the allocation API response and click the create button in parallel
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/method/next_pms.resource_management.api.allocation.handle_allocation") &&
          response.status() === 200,
      ),
      this.clickCreateButton(),
    ]);

    const responseBody = await response.json();
    const allocationName = responseBody.message.name;
    return allocationName;
  }

  async clearFilter() {
    try {
      await this.clearFilterIcon.click();
    } catch {
      console.log("Filter already cleared");
    }
  }

  async clickOnBillableToggle() {
    // The underlying input is styled out of view, so drive it through its
    // checked state rather than a raw click.
    const checkbox = this.billableToggle.first();
    const wasChecked = await checkbox.isChecked().catch(() => false);

    if (wasChecked) {
      await checkbox.uncheck({ force: true });
    } else {
      await checkbox.check({ force: true });
    }
  }

  async getErrorFromAllocationModal() {
    // Field rules live in the form's zod schema (see frontend schema/resource.ts)
    // and render as an inline form-item message, so prefer that. It only appears
    // once the form is submitted, since zod runs on submit - callers must click
    // Save/Allocate first.
    //
    // textContent() on an absent locator waits for the full test timeout, so
    // check the element exists before reading it.
    if (await this.modalErrorMessage.count()) {
      return (await this.modalErrorMessage.first().textContent())?.trim() ?? null;
    }

    // Rules the backend owns (overlapping allocations, weekend-only ranges)
    // arrive as a toast instead, with the message split across nested elements
    // alongside injected CSS.
    const toast = this.page.getByRole("region", { name: /notification/i });

    if (await toast.count()) {
      const raw = (await toast.first().innerText()) || "";

      return (
        raw
          .split("\n")
          .map((line) => line.trim())
          .find((line) => line && !line.includes("toast-root") && !line.includes("transition")) ?? null
      );
    }

    return null;
  }

  /**
   * Clear Applied filters.
   *
   * Uses the panel's "Clear all filters" button - the control a user reaches
   * for. Note it is currently broken: it empties the condition rows but never
   * clears the applied query, so the grid stays filtered (see TC59).
   */
  async clearFilters() {
    // Nothing applied means nothing to clear, and opening the panel just to
    // close it again can leave its overlay over controls a test then uses.
    if ((await this.getAppliedFilterCount()) === 0) return;

    await this.openFilterPanel();
    await this.clearAllFiltersButton.first().click();
    await this.page.waitForTimeout(1000);
    await this.closeFilterPanel();
  }

  /**
   * Clear Applied filters one condition at a time.
   *
   * The per-condition "Remove filter" button does commit the change, so this is
   * the path to use when a test needs filters genuinely gone rather than to
   * exercise the "Clear all filters" control itself.
   */
  async removeAllFilterConditions() {
    await this.openFilterPanel();
    // Each click drops a row, so re-read the count rather than caching it. The
    // panel re-seeds a blank row when the last one goes, so cap the loop rather
    // than spinning on it.
    for (let i = 0; i < 10 && (await this.getAppliedFilterCount()) > 0; i++) {
      if ((await this.removeFilterButtons.count()) === 0) break;
      await this.removeFilterButtons.first().click();
      await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    }
    await this.closeFilterPanel();
  }

  /**
   * Opens the filter panel unless it is already open.
   */
  async openFilterPanel() {
    if (
      await this.page
        .getByPlaceholder("Field")
        .first()
        .isVisible()
        .catch(() => false)
    )
      return;
    await this.filterPanelButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Closes the filter panel.
   */
  async closeFilterPanel() {
    if (
      !(await this.page
        .getByPlaceholder("Field")
        .first()
        .isVisible()
        .catch(() => false))
    )
      return;
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(800);
  }

  /**
   * The week-range labels across the header, e.g. ["Sep 7 - 13", "Sep 14 - 20"].
   */
  async getVisibleWeekRanges() {
    await this.weekRangeSpans.first().waitFor({ state: "attached", timeout: 15000 });
    // One round trip for all of them - there are a quarter's worth of columns.
    return (await this.weekRangeSpans.allInnerTexts()).map((t) => t.trim());
  }

  /**
   * The day numbers across the header.
   */
  async getVisibleDayHeaders() {
    await this.dayHeaderSpans.first().waitFor({ state: "attached", timeout: 15000 });
    return (await this.dayHeaderSpans.allInnerTexts()).map((t) => t.trim());
  }

  /**
   * Reads the count badge on the Filter button ("Filter\n3" -> 3). The badge is
   * absent when nothing is applied, which reads as 0.
   */
  async getAppliedFilterCount() {
    const text = await this.filterPanelButton.innerText().catch(() => "");
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }
}
