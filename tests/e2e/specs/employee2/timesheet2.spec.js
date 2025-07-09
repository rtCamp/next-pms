import path from "path";
import { test, expect } from "@playwright/test";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
//import data from "../../data/employee/shared-timesheet.json";
import * as allure from "allure-js-commons";

//Add type hints to help VS Code recognize TimesheetPage
/** @type {TimesheetPage} */
let timesheetPage;

// Apply storageState only for this describe block
test.use({ storageState: path.resolve(__dirname, "../../auth/employee2.json") });
// switch to employee2 session
//test.use({ role: 'employee2' });
/*
let TC2data = data.TC2;
let TC13data = data.TC13;
*/
test.describe("Employee 2 : Timesheet", () => {
  // Runs before each test
  test.beforeEach(async ({ page }) => {
    // Instantiate page objects
    timesheetPage = new TimesheetPage(page);

    // Switch to Timesheet tab
    await timesheetPage.goto();
  });

  test("TC2: Time should be added using the ‘Add’ button at the top.", async ({ page }) => {
    allure.story("Timesheet");
    const data = await readJSONFile("../data/json-files/TC2.json");
    const TC2data = data.TC2;
    // Add time entry using "Time" button
    await timesheetPage.addTimeViaTimeButton(TC2data.taskInfo);

    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(TC2data.cell);
    expect(cellText).toContain(TC2data.taskInfo.duration);
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
