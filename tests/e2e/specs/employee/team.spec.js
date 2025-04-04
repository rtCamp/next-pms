import { test, expect } from "@playwright/test";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import { Sidebar } from "../../pageObjects/sidebar";

let timesheetPage;
let sidebar;

// ------------------------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  // Instantiate page objects
  timesheetPage = new TimesheetPage(page);
  sidebar = new Sidebar(page);

  // Switch to Timesheet tab
  await timesheetPage.goto();
});

// ------------------------------------------------------------------------------------------

test("TC52: Verify the 'Team' tab isn't displayed for an employee. @workingTests", async ({}) => {
  // Assertions
  const isTeamTabAvailable = await sidebar.isTabAvailable("Team");
  expect(isTeamTabAvailable).toBeFalsy();
});
