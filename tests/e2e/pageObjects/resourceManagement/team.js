import { TimelinePage } from "./timeline";
import { expect } from "@playwright/test";

export class TeamPage extends TimelinePage {
  constructor(page) {
    super(page);
    this.deleteButton = page.getByRole("img", { name: "Delete" });
    this.firstEmployeeFromTable = page
      .locator("table:nth-child(1) tbody > div:nth-child(1) p")
      .first(); // using locator to fetch dynamically the first employee
    this.extendedListResourceAllocation = page.locator(
      "div[data-state=open] .pt-0.pb-0",
    );
    this.reportsToDropdown = page.getByRole("button", {
      name: "Reporting Manager",
    });
    this.employeeCountFromTable = page.locator(
      "table:nth-child(1) tbody > div",
    ); // locator for all employees in the table
    this.leftSidebar = page.getByText(
      "Next PMSHomeTimesheetTeamProjectTaskResource",
    );

    // filter locators related to skill filter dropdown
    this.skillFilterDropdown = page.getByRole("button", { name: "Skill" });
    this.searchSkillInput = page.getByRole("textbox", {
      name: "Search skills...",
    });
    this.skillSelectorFromModal = (value) =>
      page.getByRole("button", { name: value });
    this.twoStarsSelector = page
      .getByRole("dialog")
      .getByRole("button")
      .filter({ hasText: /^$/ })
      .nth(1);
    this.searchSkillButton = page.getByRole("button", { name: "Search" });
    this.clearSkillButton = page.getByRole("button", { name: "Clear" });

    // filter locators related to business unit filter dropdown
    this.businessUnitFilterDropdown = page.getByRole("button", {
      name: "Business Unit",
    });
    this.businessUnitOptionSelector = (value) =>
      page.getByRole("option", { name: value, exact: true });

    // filter locators related to designation filter dropdown
    this.designationFilterDropdown = page.getByRole("button", {
      name: "Designation",
    });
    this.designationSearchDropdown = page.getByPlaceholder("Designation");
    this.designationOptionSelector = (value) =>
      page.getByRole("option", { name: value });

    // filter locators related to allocation type filter dropdown
    this.allocationTypeFilterDropdown = page.getByRole("button", {
      name: "Allocation Type",
    });
    this.allocationTypeOptionSelector = (value) =>
      page.getByRole("option", { name: value, exact: true });

    // filter locators related to views filter dropdown
    this.viewsFilterDropdown = page.getByRole("combobox");
    this.selectViewOption = (view) => page.getByRole("option", { name: view });

    // filter locators related to employee filter dropdown
    this.combineWeekHoursCheckbox = page.locator("#combineWeekHours");
    this.previousWeekButton = page.getByRole("button", {
      name: "previous-week",
    });
    this.nextWeekButton = page.getByRole("button", { name: "next-week" });
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
            .includes(
              "/api/method/next_pms.resource_management.api.team.get_resource_management_team_view_data",
            ) && resp.status() === 200,
      ),
      this.page.goto("/next-pms/resource-management/team", {
        waitUntil: "domcontentloaded",
      }),
    ]);
  }

  async isPageVisible() {
    await expect(this.page).toContain("/resource-management/team");
  }

  /**
   * Adds an allocation for a specific employee by clicking on their cell and filling the allocation form.
   */
  async addAllocationFromTeamTab(
    projectName,
    customerName,
    employeeName,
    date,
    day,
  ) {
    await this.filterEmployeeByName(employeeName);
    await expect(
      this.page.locator(`//tr[1]//p[@title="${employeeName}"]`),
    ).toBeVisible({ timeout: 30000 });

    await expect(
      this.page.locator(`//tr[1]//p[@title="${employeeName}"]`),
    ).toHaveAttribute("title", employeeName, {
      timeout: 30000,
    });
    await this.page.waitForTimeout(1000); // added to avoid flaky test

    let allotmentDate = date;
    let allotmentDay = day;

    // Always uses final date & day for title
    await this.page
      .getByTitle(`${employeeName} (${allotmentDate} - ${allotmentDay})`)
      .click();

    await this.selectCustomer(customerName);
    await this.selectProject(customerName, projectName);
    await this.setHoursPerDay();

    // Wait for API + click create
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(
              "/api/method/next_pms.resource_management.api.allocation.handle_allocation",
            ) && response.status() === 200,
      ),
      this.clickCreateButton(),
    ]);

    const responseBody = await response.json();
    const allocationName = responseBody.message.name;

    // Return both: allocation name and final date used
    return { allocationName };
  }

  /**
   * Delete an allocation from team page
   */
  async deleteAllocationFromTeamTab(employeeName, date, day) {
    await this.page.waitForTimeout(1000);
    await this.page.getByTitle(`${employeeName} (${date} - ${day})`).hover();
    await this.deleteButton.click();
    await this.confirmDeleteButton.click();
  }

  /**
   * Fetches the first employee by their name in the table.
   */
  async getFirstEmployeeNameFromTable() {
    return this.firstEmployeeFromTable.textContent();
  }

  async checkIfExtendedResourceAllocationIsVisible() {
    return this.extendedListResourceAllocation.isVisible({ timeout: 5000 });
  }

  /**
   * Clicks on the first employee from the table.
   * This is useful for selecting the first employee in the team view.
   */
  async clickFirstEmployeeFromTable() {
    await this.page.waitForTimeout(200); // slight delay for the table to load
    await this.firstEmployeeFromTable.click();
  }

  /**
   * Filters the team by employee name.
   */
  async getEmployeeCountFromTable() {
    await this.page.waitForTimeout(200); // slight delay for the table to load
    return await this.employeeCountFromTable.count();
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

  /**
   * Applies the 'Reports To' filter by selecting an employee from the dropdown.
   */
  async applyReportsTo(name) {
    await this.reportsToDropdown.click();
    await this.searchAndSelectOption("Search Employee", name);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Adds a filter based on the filter name and value.
   */
  async addfilter(filterName, value) {
    switch (filterName) {
      case "Skill":
        await this.skillFilterDropdown.click();
        await this.searchSkillInput.fill(value);
        await this.skillSelectorFromModal(value).click();
        await this.twoStarsSelector.click(); // Selects the 3-star rating
        await this.searchSkillButton.click();
        break;
      case "Designation":
        await this.designationFilterDropdown.click();
        await this.designationSearchDropdown.fill(value);
        await this.designationOptionSelector(value).click();
        break;
      case "Business Unit":
        await this.businessUnitFilterDropdown.click();
        await this.businessUnitOptionSelector(value).click();
        break;
      case "Allocation Type":
        await this.allocationTypeFilterDropdown.click();
        await this.allocationTypeOptionSelector(value).click();
        break;
      default:
        throw new Error(`Unknown filter: ${filterName}`);
    }
    await this.page.locator("html").click();
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
}
