import { TimelinePage } from "./timeline";
import { getFormattedDateNDaysFromToday } from "../../utils/dateUtils";

export class TeamPage extends TimelinePage {
  constructor(page) {
    super(page);
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
   */
  async addAllocationFromTeamTab(projectName, customerName, employeeName, date, day) {
    await this.filterEmployeeByName(employeeName);

    let allotmentDate = date;
    let allotmentDay = day;

    // If it's a weekend, pick a fallback weekday and overwrite date & day
    if (allotmentDay === "Sat" || allotmentDay === "Sun") {
      const { date: fallbackDate, day: fallbackDay } = getFormattedDateNDaysFromToday(3);
      allotmentDate = fallbackDate;
      allotmentDay = fallbackDay;

      console.log(`Fallback date used: ${allotmentDate} (${allotmentDay})`);
    }

    // Always uses final date & day for title
    await this.page.getByTitle(`${employeeName} (${allotmentDate} - ${allotmentDay})`).click();

    await this.selectCustomer(customerName);
    await this.selectProject(customerName, projectName);
    await this.setHoursPerDay();

    // Wait for API + click create
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

    // ✅ Return both: allocation name and final date used
    return { allocationName, dateUsed: allotmentDate, DayUsed: allotmentDay };
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
}
