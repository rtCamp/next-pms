export class TimelinePage {
  constructor(page) {
    this.page = page;

    // header elements
    this.addAllocatioButtton = page.getByRole("button", { name: "add-allocation" });
    this.searchEmployeeFilter = page.locator('#filters input');

    //add allocation modal elements
    this.selectEmployeeDropdown = page.getByRole('button', { name: 'Select Employee' });
    this.selectEmployeeTextField = page.getByPlaceholder("Search Employee");
    this.employeeSelector = page.getByLabel("Suggestions");
    this.customerDropdown = page.getByRole("button", { name: "Search Customer" });
    this.projectDropdown = page.getByRole("button", { name: "Search Google Projects" });
    this.startDateSelector = page
      .locator("div")
      .filter({ hasText: /^Start Date\*Pick any date$/ })
      .getByRole("button");
    this.endDateSelector = page
      .locator("div")
      .filter({ hasText: /^End Date\*Pick any date$/ })
      .getByRole("button");
    this.hoursPerDayTextField = page.locator('input[name="hours_allocated_per_day"]');
    this.noteField = page.getByRole("textbox", { name: "Note" });
    this.createButton = page.getByRole("button", { name: "Create" });

    this.deleteAllocationIcon  = page.locator('.rct-item ').first();
    this.confirmDeleteButton = page.getByRole("button", { name: "Delete" });
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
    return await this.addAllocatioButtton.isVisible();
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
    await this.selectEmployeeTextField.fill(employeeName)
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
    await this.page.getByText(projectName).click();
  }

  /**
   * Selects a date range for the allocation.
   */ 
  async addDateRange() {
    const todayDateNumber = new Date([0,6].includes(new Date().getDay()) ? new Date().setDate(new Date().getDate() + (8 - new Date().getDay())) : new Date()).getDate();
    await this.startDateSelector.click();
    await this.page.getByRole('gridcell', { name: todayDateNumber }).first().click();
    await this.endDateSelector.click();
    await this.page.getByRole('gridcell', { name: todayDateNumber }).click();
  }

  /**
   * Sets the number of hours per day for the allocation.
   */
  async setHoursPerDay(hours) {
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
  async filterEmployee(employeeName) {
    await this.searchEmployeeFilter.fill(employeeName);
  }

  /**
   * Delete the allocation added.
   */
  async deleteAllocation() {
    await this.deleteAllocationIcon.click();
    await this.deleteAllocationIcon.click();
    await this.confirmDeleteButton.click();
  }

}
