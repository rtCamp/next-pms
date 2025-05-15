import path from "path";
import { test, expect } from "@playwright/test";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import { Sidebar } from "../../pageObjects/sidebar";
import * as allure from "allure-js-commons";
let timesheetPage;
let sidebar;
test.use({ storageState: path.resolve(__dirname, "../../auth/employee.json") });

// ------------------------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  // Instantiate page objects
  timesheetPage = new TimesheetPage(page);
  sidebar = new Sidebar(page);

  // Switch to Timesheet tab
  await timesheetPage.goto();
});

// ------------------------------------------------------------------------------------------

test("TC52: Verify the 'Team' tab isn't displayed for an employee.", async ({}) => {
  allure.story("Team");
  // Assertions
  const isTeamTabAvailable = await sidebar.isTabAvailable("Team");
  expect(isTeamTabAvailable).toBeFalsy();
});
