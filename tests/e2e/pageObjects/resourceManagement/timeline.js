import { getFormattedCurrentDate } from "../../utils/dateUtils";

export class TimelinePage {
  constructor(page) {
    this.page = page;
    this.currentDate = new Date();
    this.dayOfWeek = this.currentDate.toLocaleDateString("en-US", { weekday: "short" }); // Thu
    this.formattedDate = getFormattedCurrentDate(); // June 12

    // header elements
    this.addAllocatioButtton = page.getByRole("button", { name: "add-allocation" });
    this.searchEmployeeFilter = page.locator("#filters input");

    //add allocation modal elements
    this.selectEmployeeDropdown = page.getByRole("button", { name: "Select Employee" });
    this.selectEmployeeTextField = page.getByPlaceholder("Search Employee");
    this.employeeSelector = page.getByLabel("Suggestions");
    this.customerDropdown = page.getByRole("button", { name: "Search Customer" });
    this.projectDropdown = page.getByRole("button", { name: "Search Google Projects" });
    this.startDateSelector = page.locator(
      'div[data-state="open"] form > div:nth-child(3) div:nth-child(1) > div:nth-child(2) button'
    );
    this.endDateSelector = page.locator(
      'div[data-state="open"] form > div:nth-child(3) div:nth-child(2) > div:nth-child(2) button'
    );
    this.startDateWithToday = page
      .locator("div")
      .filter({ hasText: /^Start Date\*Today$/ })
      .getByRole("button");
    this.endDateWithToday = page
      .locator("div")
      .filter({ hasText: /^End Date\*Today$/ })
      .getByRole("button");
    this.hoursPerDayTextField = page.locator('input[name="hours_allocated_per_day"]');
    this.noteField = page.getByRole("textbox", { name: "Note" });
    this.createButton = page.getByRole("button", { name: "Create" });

    this.deleteAllocationIcon = page.locator(".rct-item ").first();
    this.confirmDeleteButton = page.getByRole("button", { name: "Delete" });
    this.timeAllocationRow = page.locator(".rct-hl-even");
    this.formattedDate = getFormattedCurrentDate();
    this.clearFilterIcon = page.getByRole("button", { name: "Clear search" });
  }

  /**
   * Navigates to the timeline page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/resource-management/timeline", { waitUntil: "domcontentloaded" });
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
    await this.selectEmployeeDropdown.click();
    await this.selectEmployeeTextField.fill(employeeName);
    await this.employeeSelector.click();
  }

  /**
   * Selects a customer from the dropdown.
   */
  async selectCustomer(customerName) {
    await this.customerDropdown.click();
    await this.page.getByText(customerName).click();
  }

  /**
   * Selects a project from the dropdown.
   */
  async selectProject(customerName, projectName) {
    await this.projectDropdown.click();
    await this.page.getByPlaceholder(`Search ${customerName} Projects`).fill(projectName);
    await this.page.getByRole("option", { name: projectName }).click();
  }

  /**
   * Selects a date range for the allocation.
   */
  async addDateRange(formattedDate = this.formattedDate) {
    const dayNumber = formattedDate.split(" ")[1];
    await this.startDateSelector.click();
    await this.page.getByRole("gridcell", { name: dayNumber }).first().click();
    await this.endDateSelector.click();
    await this.page.getByRole("gridcell", { name: dayNumber }).click();
  }

  /**
   * Sets the number of hours per day for the allocation.
   */
  async setHoursPerDay(hours = "8") {
    await this.hoursPerDayTextField.fill(hours);
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
   * Filters the employee list by the given name.
   */
  async filterEmployeeByName(employeeName) {
    await this.searchEmployeeFilter.fill(employeeName);
    await this.page.keyboard.press("Enter");
  }

  /**
   * Delete the allocation added.
   */
  async deleteAllocation(projectName) {
    await this.page.getByTitle(`${projectName} ${this.formattedDate} (8 hours/day)`).click();
    await this.page.getByTitle(`${projectName} ${this.formattedDate} (8 hours/day)`).click();
    await this.confirmDeleteButton.click();
  }

  /**
   * Adds a new allocation.
   */
  async addAllocation(projectName, customerName, employeeName, date) {
    await this.clickAddAllocationButton();
    await this.selectEmployee(employeeName);
    await this.selectCustomer(customerName);
    await this.selectProject(customerName, projectName);
    await this.addDateRange(date);
    await this.setHoursPerDay("8");

    // Wait for the allocation API response and click the create button in parallel
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/method/next_pms.resource_management.api.allocation.handle_allocation") &&
          response.status() === 200
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
    } catch (error) {
      console.log("Filter already cleared");
    }
  }
}
