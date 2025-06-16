import { TimelinePage } from "./timeline";

export class TeamPage extends TimelinePage {
  constructor(page) {
    super(page);
    this.deleteCell = page.getByRole("cell", { name: "8", exact: true });
    this.deleteButton = page.getByRole("img", { name: "Delete" });
  }

  /**
   * Navigates to the team page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/resource-management/team", { waitUntil: "domcontentloaded" });
  }

  async isPageVisible() {
    await expect(page).toHaveURL("/resource-management/team");
  }

  /**
   * Adds an allocation for a specific employee by clicking on their cell and filling the allocation form.
   * @param {string} projectName - The name of the project to allocate to
   * @param {string} customerName - The name of the customer associated with the project
   * @param {string} employeeName - The name of the employee to allocate
   */
  async addAllocationFromTeam(projectName, customerName, employeeName) {
    await this.filterEmployeeByName(employeeName);
    await this.page.getByTitle(`${employeeName} (${this.formattedDate} - ${this.dayOfWeek})`).click();
    await this.selectCustomer(customerName);
    await this.selectProject(customerName, projectName);
    await this.setHoursPerDay();
     
    // Wait for the allocation API response and click the create button in parallel
    const [response] = await Promise.all([
        this.page.waitForResponse(
          response =>
            response.url().includes('/api/method/next_pms.resource_management.api.allocation.handle_allocation') &&
            response.status() === 200
        ),
        this.clickCreateButton()
      ]);
      
      const responseBody = await response.json();
      const allocationName = responseBody.message.name; 
      return allocationName;
  }

  /**
   * Delete an allocation from team page
   */
  async deleteAllocation() {
    await this.page.waitForTimeout(1000);
    await this.deleteCell.hover();
    await this.deleteButton.click();
    await this.confirmDeleteButton.click();
  }
}
