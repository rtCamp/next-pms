import { TimelinePage } from "./timeline";
import { expect } from "@playwright/test";

// Filter-panel fields whose value control is a free-text input rather than a
// dropdown. "Skill" is declared `type: "string"` in the app's filter config
// (frontend/.../allocations/team/constants.ts), so it offers no options at all -
// waiting for one hangs until the test times out.
const FREE_TEXT_FILTER_FIELDS = new Set(["Skill"]);

// The allocation-type combobox rewords the values the tests pass in.
const ALLOCATION_TYPE_LABELS = {
  Billable: "Billable only",
  "Non-Billable": "Non-billable only",
  Confirmed: "Confirmed only",
  Tentative: "Tentative only",
  "No allocation": "No allocation only",
};

export class TeamPage extends TimelinePage {
  constructor(page) {
    super(page);
    this.deleteButton = page.getByRole("img", { name: "Delete" });
    // Member rows carry no ARIA roles, so anchor on the per-row name control.
    this.memberRows = page.locator("table tr").filter({ has: page.locator('[aria-label^="View "]') });
    this.firstEmployeeFromTable = this.memberRows.first().locator('[aria-label^="View "]').first();
    // The chevron that expands a member into their allocated projects. Its label
    // stays "Expand" while aria-expanded flips, so match either wording.
    this.firstMemberExpandButton = this.memberRows
      .first()
      .getByRole("button", { name: /^(Expand|Collapse)$/ })
      .first();
    this.reportsToDropdown = page.getByRole("button", { name: "Reporting Manager" });
    // One "View <name> details" control per member row.
    this.employeeCountFromTable = page.getByRole("table").getByRole("button", { name: /^View .* details$/ });
    // The grid has no ARIA roles, so anchor a member's row on that control.
    this.memberRow = (employeeName) =>
      page.locator("table tr").filter({ has: page.locator(`[aria-label="View ${employeeName} details"]`) });
    this.leftSidebar = page.getByText("Next PMSHomeTimesheetTeamProjectTaskResource");

    // filter locators related to skill filter dropdown
    this.skillFilterDropdown = page.getByRole("button", { name: "Skill" });
    this.searchSkillInput = page.getByRole("textbox", { name: "Search skills..." });
    this.skillSelectorFromModal = (value) => page.getByRole("button", { name: value });
    this.twoStarsSelector = page.getByRole("dialog").getByRole("button").filter({ hasText: /^$/ }).nth(1);
    this.searchSkillButton = page.getByRole("button", { name: "Search" });
    this.clearSkillButton = page.getByRole("button", { name: "Clear" });

    // filter locators related to business unit filter dropdown
    this.businessUnitFilterDropdown = page.getByRole("button", { name: "Business Unit" });
    this.businessUnitOptionSelector = (value) => page.getByRole("option", { name: value, exact: true });

    // filter locators related to designation filter dropdown
    this.designationFilterDropdown = page.getByRole("button", { name: "Designation" });
    this.designationSearchDropdown = page.getByPlaceholder("Designation");
    this.designationOptionSelector = (value) => page.getByRole("option", { name: value });

    // filter locators related to allocation type filter dropdown
    this.allocationTypeFilterDropdown = page.getByRole("button", { name: "Allocation Type" });
    this.allocationTypeOptionSelector = (value) => page.getByRole("option", { name: value, exact: true });

    // filter locators related to views filter dropdown
    this.viewsFilterDropdown = page.getByRole("combobox");
    this.selectViewOption = (view) => page.getByRole("option", { name: view });

    // filter locators related to employee filter dropdown
    this.combineWeekHoursCheckbox = page.locator("#combineWeekHours");
    // The grid steps by quarter now, not by week - "previous-week"/"next-week"
    // no longer exist. These alias the inherited quarter controls so the
    // existing call sites keep reading the same.
    this.previousWeekButton = this.prevQuarterButton;
    this.nextWeekButton = this.nextQuarterButton;
  }

  /**
   * Navigates to the team page and waits for it to fully load.
   */
  async goto() {
    await Promise.all([
      this.page.waitForResponse(
        (resp) =>
          resp
            .url()
            .includes("/api/method/next_pms.resource_management.api.team.get_resource_management_team_view_data") &&
          resp.status() === 200,
      ),
      this.page.goto("/next-pms/allocations/team", { waitUntil: "domcontentloaded" }),
    ]);
  }

  async isPageVisible() {
    await expect(this.page).toHaveURL(/\/allocations\/team/);
  }

  /**
   * Adds an allocation for a specific employee on a specific date.
   *
   * The per-day cell this used to click is gone. A member row is now 13 cells
   * wide - one per *week* of the quarter, not one per day - and an empty cell
   * carries no click target (verified: 0 `title` attributes anywhere on the
   * page, and the capacity text is not clickable). So there is no "cell for
   * employee X on date Y" left to click, and the date has to go through the
   * allocation dialog's own picker. Same conclusion as the project tab.
   */
  async addAllocationFromTeamTab(projectName, customerName, employeeName, date, day) {
    await this.filterEmployeeByName(employeeName);
    await this.memberRow(employeeName).first().waitFor({ state: "visible", timeout: 20000 });

    const allocationName = await this.addAllocation(projectName, customerName, employeeName, date);

    return { allocationName };
  }

  /**
   * Delete an allocation from team page
   */
  async deleteAllocationFromTeamTab(employeeName, date, day) {
    // Allocations are chips in the grid now, and their popover carries the
    // delete action - there is no per-day cell to hover. deleteAllocation acts
    // on the first chip in the grid, so filter to the employee first.
    await this.filterEmployeeByName(employeeName);
    await this.deleteAllocation();
  }

  /**
   * Returns a member row's capacity text, e.g. "8h free 8h free Full ...".
   * The grid reports remaining capacity per day rather than allocated hours, and
   * carries no per-day identifier, so callers compare the whole row before and
   * after a change instead of targeting one date.
   */
  async getMemberRowText(employeeName) {
    const row = this.memberRow(employeeName).first();
    await row.waitFor({ state: "visible", timeout: 15000 });

    return (await row.innerText()).replace(/\s+/g, " ").trim();
  }

  /**
   * Fetches the first employee by their name in the table.
   */
  async getFirstEmployeeNameFromTable() {
    return this.firstEmployeeFromTable.textContent();
  }

  async checkIfExtendedResourceAllocationIsVisible() {
    // Expanding reveals the member's project rows inline rather than opening a
    // separate panel, so the row's own expanded state is the signal.
    return (await this.firstMemberExpandButton.getAttribute("aria-expanded")) === "true";
  }

  /**
   * Clicks on the first employee from the table.
   * This is useful for selecting the first employee in the team view.
   */
  async clickFirstEmployeeFromTable() {
    const expand = this.firstMemberExpandButton;
    await expand.waitFor({ state: "visible", timeout: 15000 });

    // Every member row is covered by a full-size transparent button
    // (absolute inset-0 z-10) that swallows pointer events, so a normal click on
    // the chevron is intercepted and retries until the test times out.
    // dispatchEvent targets the chevron directly, skipping hit-testing - and
    // unlike click({force:true}) it does not also fire the overlay's
    // member-details dialog, which would sit over the rows we then assert on.
    await expand.dispatchEvent("click");
    await this.page.waitForTimeout(1500);
  }

  /**
   * Filters the team by employee name.
   */
  async getEmployeeCountFromTable() {
    await this.page.waitForTimeout(200); // slight delay for the table to load
    return await this.employeeCountFromTable.count();
  }

  /**
   * The member names currently rendered, read from each row's
   * "View <name> details" control.
   *
   * More reliable than the row count for asserting a filter narrowed things:
   * the grid renders a fixed page of 10, so once a filtered set also reaches 10
   * the counts are equal and say nothing. Comparing the names shows what
   * actually changed.
   */
  async getEmployeeNamesFromTable() {
    await this.page.waitForTimeout(200);

    const labels = await this.employeeCountFromTable.evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label") || "")
    );

    return labels.map((l) => l.replace(/^View\s+/, "").replace(/\s+details$/, "").trim()).filter(Boolean);
  }

  /**
   * Performs a search and selection within a modal based on a placeholder text.
   */
  async searchAndSelectOption(placeholder, value) {
    const searchInput = this.page.getByRole("dialog").getByPlaceholder(`${placeholder}`);
    await searchInput.fill(value);
    await this.page.waitForTimeout(1000);
    await this.page.getByRole("option", { name: value }).click();
  }

  /**
   * Applies the 'Reports To' filter by selecting an employee from the dropdown.
   */
  async applyReportsTo(name) {
    // The reporting-manager control moved into the filter panel.
    await this.addFilterCondition("Reporting Manager", name);
  }

  /**
   * Adds a filter based on the filter name and value.
   */
  async addfilter(filterName, value) {
    // The per-field dropdown buttons ("Skill", "Designation", "Business Unit",
    // "Allocation Type") are gone. Skill and Business Unit became fields of the
    // query-builder panel, while Designation and Allocation Type are standalone
    // comboboxes identified by their aria-labels.
    switch (filterName) {
      case "Skill":
      case "Business Unit":
      case "Tag":
      case "Reporting Manager":
        await this.addFilterCondition(filterName, value);
        return;

      case "Designation":
        await this.pickFromLabelledCombobox("Toggle options", value);
        return;

      case "Allocation Type":
        // The options are reworded: "Billable" is offered as "Billable only".
        await this.pickFromLabelledCombobox("Select options", ALLOCATION_TYPE_LABELS[value] ?? value);
        return;

      default:
        throw new Error(
          `Unknown filter: ${filterName}. Available: Skill, Business Unit, Tag, ` +
            `Reporting Manager (filter panel), Designation, Allocation Type (comboboxes).`,
        );
    }
  }

  /**
   * Picks a value from one of the toolbar comboboxes, which carry aria-labels
   * rather than visible field names.
   */
  async pickFromLabelledCombobox(ariaLabel, value) {
    const combobox = this.page.getByRole("combobox", { name: ariaLabel }).first();
    await combobox.waitFor({ state: "visible", timeout: 15000 });
    await combobox.click({ force: true });
    await this.page.waitForTimeout(1000);

    const option = this.page.getByRole("option", { name: value, exact: true }).first();
    await option.waitFor({ state: "visible", timeout: 10000 });
    await option.click();
    await this.page.waitForTimeout(1500);
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(800);
  }

  /**
   * Clicks on the Combine Week Hours checkbox in header.
   */
  async clickCombineWeekHoursCheckbox() {
    await this.combineWeekHoursCheckbox.click();
  }

  /**
   * Clicks the view Previous Week button in header.
   */
  async clickPreviousWeekButton() {
    await this.previousWeekButton.click();
  }

  /**
   * Clicks the view Next Week button in header.
   */
  async clickNextWeekButton() {
    await this.nextWeekButton.click();
  }

  /**
   * Selects a specific view from the views filter dropdown.
   *
   */
  async selectView(view) {
    await this.viewsFilterDropdown.click();
    try {
      await this.selectViewOption(view).click();
    } catch {
      throw new Error(`View option '${view}' not found in the dropdown.`);
    }
    await this.page.locator("html").click(); // Click outside to close the dropdown
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
      await this.page.waitForTimeout(1000);
    }
    // Conditions are ANDed, but writing into the last row overwrites whatever
    // it holds, so a new row is needed once the last one is actually in use.
    // Key that on the row's *value*, not its field: the panel opens with a row
    // whose field is pre-filled to the first available one ("Skill") and whose
    // value is empty, and that row is meant to be filled in rather than skipped
    // - adding a row on top of it leaves an empty condition behind, which the
    // Filter count badge still counts.
    const lastValue = await this.page
      .getByPlaceholder("Value")
      .last()
      .inputValue()
      .catch(() => "");
    if (needsNewRow || lastValue !== "") {
      await this.page.getByText("Add filter").click();
      await this.page.waitForTimeout(700);
    }
    const exact = (t) => new RegExp(`^${String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

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

    if (FREE_TEXT_FILTER_FIELDS.has(fieldLabel)) {
      // The typed text *is* the value; the grid refetches on a debounce.
      await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      return;
    }

    await this.page.waitForTimeout(900);

    // Prefer an exact option; fall back to a contains match, since some env
    // values are shorter than the label shown (e.g. "Renish" -> "Renish PM").
    let option = this.page.getByRole("option", { name: exact(value) }).first();
    if ((await option.count()) === 0) {
      option = this.page.getByRole("option", { name: value }).first();
    }
    await option.waitFor({ state: "visible", timeout: 10000 });
    await option.click();

    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  }
}
