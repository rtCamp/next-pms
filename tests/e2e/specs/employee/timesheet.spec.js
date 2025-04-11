import { test, expect } from "@playwright/test";
import { secondsToDuration, durationToSeconds } from "../../utils/dateUtils";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import data from "../../data/employee/shared-timesheet.json";
//Add type hints to help VS Code recognize TimesheetPage
/** @type {TimesheetPage} */
let timesheetPage;

// Load test data
let TC2data = data.TC2;
let TC3data = data.TC3;
let TC4data = data.TC4;
let TC5data = data.TC5;
let TC6data = data.TC6;
let TC12data = data.TC12;
let TC13data = data.TC13;
let TC14data = data.TC14;
let TC15data = data.TC15;
let TC82data = data.TC82;
let TC83data = data.TC83;
let TC84data = data.TC84;
let TC86data = data.TC86;
// ------------------------------------------------------------------------------------------

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

test("TC4: Added time and description should be editable. ", async ({ page }) => {
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

test("TC5: Add a new row in the already added time.  ", async ({ page }) => {
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

test("TC6: Delete the added time entry from the non-submitted timesheet.  ", async ({ page }) => {
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
  // Submit timesheet
  await timesheetPage.submitTimesheet();

  // Reload page to ensure changes are reflected
  await page.reload();

  // Get timesheet status
  const status = await timesheetPage.getTimesheetStatus();

  // Assertions
  expect(status).toBe("Approval Pending");
});

test("TC9: Open task details popup   ", async ({}) => {
  // Import liked tasks
  await timesheetPage.importLikedTasks();
  // Open random task details
  const randomTask = await timesheetPage.openRandomTaskDetails();

  // Assertions
  const isTaskDetailsDialogVisible = await timesheetPage.isTaskDetailsDialogVisible(randomTask);
  expect(isTaskDetailsDialogVisible).toBeTruthy();
});

test("TC11: Verify that the review timesheet pane is not available for an employee.   ", async ({}) => {
  // Click on timesheet status
  await timesheetPage.clickonTimesheetStatus();

  // Assertions
  const isSubmitForApprovalModalVisible = await timesheetPage.isSubmitForApprovalModalVisible();
  expect(isSubmitForApprovalModalVisible).toBeTruthy();

  const isReviewTimesheetPaneVisible = await timesheetPage.isReviewTimesheetPaneVisible();
  expect(isReviewTimesheetPaneVisible).toBeFalsy();
});

test("TC12: Verify the 'Import liked tasks' option.   ", async ({}) => {
  // Import liked tasks
  await timesheetPage.importLikedTasks();

  // Retrive tasks from the timesheet
  const tasks = await timesheetPage.getTimesheetTasks();

  // Assertion to verify that TC12 data will be present in task.sort()
  expect(tasks.sort()).toEqual(expect.arrayContaining(TC12data.tasks.sort()));
});

test("TC13: Verify an employee can apply for leave via Timesheet tab.   ", async ({}) => {
  // Apply for leave
  await timesheetPage.applyForLeave(TC13data.leave.desc);

  // Assertions
  const cellText = await timesheetPage.getCellText(TC13data.cell);
  expect(cellText).toContain("8");
});

test("TC14: Verify the billable status of a billable task.", async ({}) => {
  // Import liked tasks
  await timesheetPage.importLikedTasks();

  // Assertions
  const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC14data.cell);
  expect(isTimeEntryBillable).toBeTruthy();
});

test("TC15: Verify the billable status of a non-billable task.   ", async ({}) => {
  // Import liked tasks
  await timesheetPage.importLikedTasks();

  // Assertions
  const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC15data.cell);
  expect(isTimeEntryBillable).toBeFalsy();
});

test("TC82: Verify hourly consulting rate when no default billing rate is used for Fixed cost project   ", async ({}) => {
  //Assertions
  const projectCostAmount = TC82data.payloadCalculateBillingRate.total_costing_amount;
  const employeeHourlyBillingRate = TC82data.payloadCalculateBillingRate.hourly_billing_rate;
  expect(
    projectCostAmount,
    "Verify the project cost amount and employee CTC amount per hour matches for Fixed Cost Project"
  ).toBeCloseTo(employeeHourlyBillingRate, 3);
});

test("TC83: Verify hourly consulting rate when no default billing rate is used for Retainer project   ", async ({}) => {
  //Assertions
  const projectCostAmount = TC83data.payloadCalculateBillingRate.total_costing_amount;
  const employeeHourlyBillingRate = TC83data.payloadCalculateBillingRate.hourly_billing_rate;

  expect(
    projectCostAmount,
    "Verify the project cost amount and employee CTC amount per hour matches for Retainer Project"
  ).toBeCloseTo(employeeHourlyBillingRate, 3);
});

test("TC84: Verify hourly consulting rate when no default billing rate is used for Time and Material project   ", async ({}) => {
  //Assertions
  const projectCostAmount = TC84data.payloadCalculateBillingRate.total_costing_amount;
  const employeeHourlyBillingRate = TC84data.payloadCalculateBillingRate.hourly_billing_rate;

  expect(
    projectCostAmount,
    "Verify the project cost amount and employee CTC amount per hour matches for Time and Material Project"
  ).toBeCloseTo(employeeHourlyBillingRate, 3);
});

test("TC86: Billing rate in the timesheet should match the employee's rate from the project billing team child table for Time and Material Project", async ({}) => {
  //Assertions
  const total_billable_amount = TC86data.payloadCalculateBillingRate.total_billable_amount;
  const hourly_billing_rate = TC86data.payloadCreateProject.custom_project_billing_team[0].hourly_billing_rate;
  expect(
    total_billable_amount,
    "Verify the billing rate for the employee should match the value provided in project billing team child table"
  ).toEqual(hourly_billing_rate);
});
