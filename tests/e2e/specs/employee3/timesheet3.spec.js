const { test, expect } = require("../../playwright.fixture.cjs");
import path from "path";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import { TaskPage } from "../../pageObjects/taskPage";
import * as allure from "allure-js-commons";
import { readJSONFile } from "../../utils/fileUtils";
//Add type hints to help VS Code recognize TimesheetPage
/** @type {TimesheetPage} */
let timesheetPage;


test.describe.serial("Employee3 : Timesheet", () => {
  test.beforeEach(async ({ page }) => {
    // Instantiate page objects
    timesheetPage = new TimesheetPage(page);
    taskPage = new TaskPage(page);

    // Switch to Timesheet tab
    await timesheetPage.goto();
  });
  test("TC6: Delete the added time entry from the non-submitted timesheet.  ", async ({ page, jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC6.json");
    const data = await readJSONFile(stubPath);
    const TC6data = data.TC6;
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Delete time entry
    await timesheetPage.deleteTimeRow(TC6data.cell, { desc: TC6data.taskInfo.desc });

    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(TC6data.cell);
    expect(cellText).toContain("-");
  });

  test("TC7: Submit the weekly timesheet ", async ({ page }) => {
    allure.story("Timesheet");

    // Submit timesheet
    await timesheetPage.submitTimesheet();

    // Reload page to ensure changes are reflected
    await page.reload({ waitUntil: "networkidle" });

    // Get timesheet status
    const status = await timesheetPage.getTimesheetStatus();

    // Assertions
    expect(status).toBe("Approval Pending");
  });
});
