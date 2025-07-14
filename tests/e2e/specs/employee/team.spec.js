import path from "path";
const { test, expect } = require("../../playwright.fixture.cjs");
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import { Sidebar } from "../../pageObjects/sidebar";
import * as allure from "allure-js-commons";

let timesheetPage;
let sidebar;

//test.use({ storageState: path.resolve(__dirname, "../../auth/employee.json") });
// switch to employee2 session
//test.use({ role: 'employee' });

test.describe("Employee : Team Tab", () => {
  test.beforeEach(async ({ page }) => {
    timesheetPage = new TimesheetPage(page);
    sidebar = new Sidebar(page);

    // Switch to Timesheet tab
    await timesheetPage.goto();
  });

  test("TC52: Verify the 'Team' tab isn't displayed for an employee.", async () => {
    allure.story("Team");
    const isTeamTabAvailable = await sidebar.isTabAvailable("Team");
    expect(isTeamTabAvailable).toBeFalsy();
  });
});
