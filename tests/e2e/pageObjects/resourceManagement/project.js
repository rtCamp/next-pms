/**
 * Represents the Project page in the resource management section.
 * Extends the TimelinePage and provides methods for navigating to and verifying the project page.
 */
import { TimelinePage } from "./timeline";

export class ProjectPage extends TimelinePage {
  constructor(page) {
    super(page);
    this.filterByProjectInput = page.getByRole("textbox", { name: "Project Name" });

    //table elements
    this.projectTableTitle = page.getByRole("cell", { name: "Projects" });
    this.deleteButton = page.getByRole("img", { name: "Delete" }).first();
    this.editIcon = page.getByRole("img", { name: "Edit" }).first();
    this.clipboardIcon = page.getByRole("img", { name: "Copy" }).first();
  }

  /**
   * Navigates to the project page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/resource-management/project", { waitUntil: "domcontentloaded" });
  }

  /**
   * Verifies that the page is visible and the project table title is displayed.
   */
  async isPageVisible() {
    await expect(this.projectTableTitle).toBeVisible();
  }

  /**
   * Filters the project table by the given project name.
   */
  async filterByProject(projectName) {
    await this.filterByProjectInput.click();
    await this.filterByProjectInput.fill(projectName);
  }

  /**
   * Adds an allocation for a specific employee by clicking on their cell and filling the allocation form.
   */
  async addAllocationFromProjectTab(projectName, customerName, employeeName, date, day, allocation = "8") {
    if (!(await this.filterByProjectInput.isVisible())) {
      await this.filterByProject(projectName);
    }
    let allotmentDate = date;
    let allotmentDay = day;

    await this.page.getByTitle(`${projectName} (${allotmentDate} - ${allotmentDay})`).click();
    await this.selectEmployee(employeeName);
    await this.selectCustomer(customerName);
    await this.selectProject(customerName, projectName);
    await this.setHoursPerDay(allocation);

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
    return { allocationName };
  }

  /**
   * Delete the allocation added.
   */
  async deleteAllocationFromProjectTab(projectName, date, day) {
    await this.page.waitForTimeout(1000);
    await this.page.getByTitle(`${projectName} (${date} - ${day})`).hover();
    await this.deleteButton.click();
    await this.confirmDeleteButton.click();
  }

  /**
   * Click on the clipboard icon on hover
   */
  async clickClipboardIcon(projectName, date, day) {
    await this.page.waitForTimeout(1000);
    await this.page.getByTitle(`${projectName} (${date} - ${day})`).hover();
    await this.clipboardIcon.click();
  }

  /**
   * Click on the edit icon on hover
   */
  async clickEditIcon(projectName, date, day) {
    await this.page.waitForTimeout(1000);
    await this.page.getByTitle(`${projectName} (${date} - ${day})`).hover();
    await this.editIcon.click();
  }

  /**
   * Add a allocated time on a add allocation modal
   */
  async addAllocationFromProjectTabFromClipboard(hoursPerDay, totalAllocatedHours = "100") {
    this.totalHoursTextField.fill("");
    this.totalHoursTextField.fill(totalAllocatedHours);
    await this.setHoursPerDay(hoursPerDay);
    await this.clickCreateButton();
  }

  /**
   * Edit a allocated time on a add allocation modal
   */
  async editAllocationFromProjectTab(hoursPerDay, totalAllocatedHours = "100") {
    this.totalHoursTextField.fill("");
    this.totalHoursTextField.fill(totalAllocatedHours);
    await this.setHoursPerDay(hoursPerDay);
  }

  /**
   * Get an allocation time from Project page using project name and allocation date
   */
  async getAllocationFromProjectTab(projectName, date, day) {
    await this.page.waitForTimeout(1000);
    const allocationTime = await this.page.getByTitle(`${projectName} (${date} - ${day})`).textContent();
    return allocationTime;
  }
}
