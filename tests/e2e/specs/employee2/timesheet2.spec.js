import path from "path";
import { test, expect } from "@playwright/test";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import data from "../../data/employee/shared-timesheet.json";
import * as allure from "allure-js-commons";

//Add type hints to help VS Code recognize TimesheetPage
/** @type {TimesheetPage} */
let timesheetPage;

// Apply storageState only for this describe block
test.use({ storageState: path.resolve(__dirname, "../../auth/employee2.json") });
let TC13data = data.TC13;
test.describe("Employee 2 : Timesheet", () => {
  // Runs before each test
  test.beforeEach(async ({ page }) => {
    // Instantiate page objects
    timesheetPage = new TimesheetPage(page);

    // Switch to Timesheet tab
    await timesheetPage.goto();
  });
  test("TC13: Verify an employee can apply for leave via Timesheet tab.   ", async ({}) => {
    allure.story("Timesheet");
    // Apply for leave
    await timesheetPage.applyForLeave(TC13data.leave.desc);

    // Reload page to ensure changes are reflected
    await timesheetPage.page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(TC13data.cell);
    expect(cellText).toContain("8");
  });
});
