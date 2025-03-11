import path from "path";
import fs from "fs";
import { test, expect } from "@playwright/test";
import { getWeekdayName } from "../../utils/dateUtils";
import { secondsToDuration, durationToSeconds } from "../../utils/dateUtils";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import data from "../../data/employee/shared-timesheet.json";

const employeeTimesheetDataFilePath = path.resolve(__dirname, "../../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file
let timesheetPage;

// Load test data
let TC2data = data.TC2;
let TC3data = data.TC3;
let TC4data = data.TC4;
let TC5data = data.TC5;
let TC6data = data.TC6;
let TC72data = data.TC72;

// ------------------------------------------------------------------------------------------

test.beforeAll(async ({}) => {
  // Compute cell info for TC73
  data.TC73.cell.col = getWeekdayName(new Date()); // Get today's weekday name

  // Write back updated JSON
  fs.writeFileSync(employeeTimesheetDataFilePath, JSON.stringify(data, null, 2));
});

test.beforeEach(async ({ page }) => {
  // Instantiate page objects
  timesheetPage = new TimesheetPage(page);

  // Switch to Timesheet tab
  await timesheetPage.goto();
});

// ------------------------------------------------------------------------------------------

test("TC2: Time should be added using the ‘Add’ button at the top.", async ({ page }) => {
  // Add time entry using "Time" button
  await timesheetPage.addTimeViaTimeButton(TC2data.taskInfo);

  // Reload page to ensure changes are reflected
  await page.reload();

  // Assertions
  const cellText = await timesheetPage.getCellText(TC2data.cell);
  expect(cellText).toContain(TC2data.taskInfo.duration);
});

test("TC3: Time should be added using the direct timesheet add buttons.", async ({ page }) => {
  // Import liked tasks
  await timesheetPage.importLikedTasks();

  // Add time entry using "+" button in timesheet
  await timesheetPage.addTimeViaCell(TC3data.cell, {
    duration: TC3data.taskInfo.duration,
    desc: TC3data.taskInfo.desc,
  });

  // Reload page to ensure changes are reflected
  await page.reload();

  // Assertions
  const cellText = await timesheetPage.getCellText(TC3data.cell);
  expect(cellText).toContain(TC3data.taskInfo.duration);
});

test("TC4: Added time and description should be editable.", async ({ page }) => {
  // Update time entry
  await timesheetPage.updateTimeRow(TC4data.cell, {
    desc: TC4data.payloadCreateTimesheet.description,
    newDesc: TC4data.taskInfo.desc,
    newDuration: TC4data.taskInfo.duration,
  });

  // Reload page to ensure changes are reflected
  await page.reload();

  // Assertions
  const cellText = await timesheetPage.getCellText(TC4data.cell);
  expect(cellText).toContain(TC4data.taskInfo.duration);

  const cellTooltipText = await timesheetPage.getCellTooltipText(TC4data.cell);
  expect(cellTooltipText).toContain(TC4data.taskInfo.desc);
});

test("TC5: Add a new row in the already added time.", async ({ page }) => {
  // Store cell text before new row addition
  const beforeCellText = await timesheetPage.getCellText(TC5data.cell);

  // Add time entry
  await timesheetPage.addTimeRow(TC5data.cell, { duration: TC5data.taskInfo.duration, desc: TC5data.taskInfo.desc });

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

test("TC6: Delete the added time entry from the non-submitted timesheet.", async ({ page }) => {
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

test("TC7: Submit the weekly timesheet", async ({ page }) => {
  // Submit timesheet
  await timesheetPage.submitTimesheet();

  // Reload page to ensure changes are reflected
  await page.reload();

  // Get timesheet status
  const status = await timesheetPage.getTimesheetStatus();

  // Assertions
  expect(status).toBe("Approval Pending");
});

test("TC9: Open task details popup", async ({}) => {
  // Import liked tasks
  await timesheetPage.importLikedTasks();

  // Open random task details
  const randomTask = await timesheetPage.openRandomTaskDetails();

  // Assertions
  const isTaskDetailsDialogVisible = await timesheetPage.isTaskDetailsDialogVisible(randomTask);
  expect(isTaskDetailsDialogVisible).toBeTruthy();
});

test("TC71: Verify that the review timesheet panel is not available for an employee.", async ({}) => {
  // Click on timesheet status
  await timesheetPage.clickonTimesheetStatus();

  // Assertions
  const isSubmitForApprovalModalVisible = await timesheetPage.isSubmitForApprovalModalVisible();
  expect(isSubmitForApprovalModalVisible).toBeTruthy();

  const isReviewTimesheetPaneVisible = await timesheetPage.isReviewTimesheetPaneVisible();
  expect(isReviewTimesheetPaneVisible).toBeFalsy();
});

test("TC72: Verify the 'Import liked tasks' option.", async ({}) => {
  // Import liked tasks
  await timesheetPage.importLikedTasks();

  // Retrive tasks from the timesheet
  const tasks = await timesheetPage.getTimesheetTasks();

  // Assertions
  expect(tasks.sort()).toEqual(TC72data.tasks.sort());
});
