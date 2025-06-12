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
  async addAllocationFromProject(projectName, customerName, employeeName) {
    await this.filterByProject(projectName);
    console.log(`${projectName} (${this.formattedDate} - ${this.dayOfWeek})`);
    await this.page.getByTitle(`${projectName} (${this.formattedDate} - ${this.dayOfWeek})`).click();
    await this.selectEmployee(employeeName);
    await this.selectCustomer(customerName);
    await this.selectProject(customerName, projectName);
    await this.setHoursPerDay("8");
    await this.clickCreateButton();
  }
}
