const { test, expect } = require("../../playwright.fixture.cjs");
import path from "path";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import * as allure from "allure-js-commons";
import { readJSONFile } from "../../utils/fileUtils";
import { durationToSeconds, secondsToDuration } from "../../utils/dateUtils";

//Add type hints to help VS Code recognize TimesheetPage
/** @type {TimesheetPage} */
let timesheetPage;
const TIME_ENTRIES_UPDATED_MSG = "Time entries updated successfully.";

test.describe.serial("Employee3 : Timesheet", () => {
  test.beforeEach(async ({ page }) => {
    // Instantiate page objects
    timesheetPage = new TimesheetPage(page);
    // Switch to Timesheet tab
    await timesheetPage.goto();
  });
  test("TC5: Add a new row in the already added time.  ", async ({ page, jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC5.json");
    const data = await readJSONFile(stubPath);
    const TC5data = data.TC5;

    // Store cell text before new row addition
    const beforeCellText = await timesheetPage.getCellText(TC5data.cell);

    // Add time entry
    await timesheetPage.addTimeRow(TC5data.cell, { duration: TC5data.taskInfo.duration, desc: TC5data.taskInfo.desc });

    //Verify notification
    await expect(timesheetPage.toastNotification(TIME_ENTRIES_UPDATED_MSG)).toBeVisible();
    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const afterCellText = await timesheetPage.getCellText(TC5data.cell);
    const afterDuration = secondsToDuration(
      durationToSeconds(beforeCellText) + durationToSeconds(TC5data.taskInfo.duration)
    );
    expect(afterCellText).toContain(afterDuration);

    const cellTooltipText = await timesheetPage.getCellTooltipText(TC5data.cell);
    expect(cellTooltipText).toContain(TC5data.taskInfo.desc);
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
