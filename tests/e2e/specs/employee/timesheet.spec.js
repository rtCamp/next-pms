const { test, expect } = require("../../playwright.fixture.cjs");

import path from "path";
import { secondsToDuration, durationToSeconds } from "../../utils/dateUtils";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import { TaskPage } from "../../pageObjects/taskPage";
import * as allure from "allure-js-commons";
import { readJSONFile } from "../../utils/fileUtils";
//Add type hints to help VS Code recognize TimesheetPage
/** @type {TimesheetPage} */
let timesheetPage;
let taskPage;

test.describe("Employee : Timesheet", () => {
  test.beforeEach(async ({ page }) => {
    // Instantiate page objects
    timesheetPage = new TimesheetPage(page);
    taskPage = new TaskPage(page);

    // Switch to Timesheet tab
    await timesheetPage.goto();
  });

  // ------------------------------------------------------------------------------------------

  test("TC3: Time should be added using the direct timesheet add buttons.", async ({ page, jsonDir }) => {
    allure.story("Timesheet");
    // 1) Build the path to your per‑TC JSON stub
    const stubPath = path.join(jsonDir, "TC3.json");
    const data = await readJSONFile(stubPath);

    const TC3data = data.TC3;

    // Import liked tasks
    await timesheetPage.importLikedTasks();
    // Add time entry using "+" button in timesheet
    await timesheetPage.addTimeViaCell(TC3data.cell, {
      duration: TC3data.taskInfo.duration,
      desc: TC3data.taskInfo.desc,
    });
    await timesheetPage.toastNotification(TC3data.notification).waitFor({ state: "visible" });
    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(TC3data.cell);
    expect(cellText).toContain(TC3data.taskInfo.duration);
  });

  test("TC4: Added time and description should be editable. ", async ({ page, jsonDir }) => {
    allure.story("Timesheet");
    // 1) Build the path to your per‑TC JSON stub
    const stubPath = path.join(jsonDir, "TC4.json");
    const entry = await readJSONFile(stubPath);
    const tcData = entry["TC4"];

    const {
      cell,
      payloadCreateTimesheet: { description },
      taskInfo: { desc: newDesc, duration: newDuration },
    } = tcData;

    await timesheetPage.updateTimeRow(cell, {
      desc: description,
      newDesc,
      newDuration,
    });
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

  test("TC9: Open task details popup", async () => {
    allure.story("Timesheet");
    // Import liked tasks
    await timesheetPage.importLikedTasks();
    // Open random task details
    const randomTask = await timesheetPage.openRandomTaskDetails();

    // Assertions
    const isTaskDetailsDialogVisible = await timesheetPage.isTaskDetailsDialogVisible(randomTask);
    expect(isTaskDetailsDialogVisible).toBeTruthy();
  });

  test("TC11: Verify that the review timesheet pane is not available for an employee.   ", async () => {
    allure.story("Timesheet");
    // Click on timesheet status
    await timesheetPage.clickonTimesheetStatus();

    // Assertions
    const isSubmitForApprovalModalVisible = await timesheetPage.isSubmitForApprovalModalVisible();
    expect(isSubmitForApprovalModalVisible).toBeTruthy();

    const isReviewTimesheetPaneVisible = await timesheetPage.isReviewTimesheetPaneVisible();
    expect(isReviewTimesheetPaneVisible).toBeFalsy();
  });

  test("TC12: Verify the 'Import liked tasks' option.   ", async ({ jsonDir }) => {
    allure.story("Timesheet");

    const stubPath = path.join(jsonDir, "TC12.json");
    const data = await readJSONFile(stubPath);
    const TC12data = data.TC12;

    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Retrive tasks from the timesheet
    const tasks = await timesheetPage.getTimesheetTasks();

    // Assertion to verify that TC12 data will be present in task.sort()
    expect(tasks.sort()).toEqual(expect.arrayContaining(TC12data.tasks.sort()));
  });

  test("TC14: Verify the billable status of a billable task.", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC14.json");
    const data = await readJSONFile(stubPath);
    const TC14data = data.TC14;
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Assertions
    const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC14data.cell);
    expect(isTimeEntryBillable).toBeTruthy();
  });

  test("TC15: Verify the billable status of a non-billable task.   ", async ({ jsonDir }) => {
    allure.story("Timesheet");

    const stubPath = path.join(jsonDir, "TC15.json");
    const data = await readJSONFile(stubPath);
    const TC15data = data.TC15;

    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Assertions
    const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC15data.cell);
    expect(isTimeEntryBillable).toBeFalsy();
  });

  test("TC23: Verify adding time to the task directly from the task tab by using the clock icon button in the row.", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Task");
    const stubPath = path.join(jsonDir, "TC23.json");
    const data = await readJSONFile(stubPath);

    const TC23data = data.TC23;
    await taskPage.goto();
    await taskPage.searchTask(TC23data.payloadCreateTask.subject);
    await taskPage.clickClockIcon();
    await taskPage.addTime("8", TC23data.payloadCreateTask.description);
    await expect(page.getByText("New Timesheet created successfully.", { exact: true })).toBeVisible();
  });

  test("TC82: Verify hourly consulting rate when no default billing rate is used for Fixed cost project   ", async ({
    jsonDir,
  }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC82.json");
    const data = await readJSONFile(stubPath);
    const TC82data = data.TC82;
    //Assertions
    const total_costing_amount = TC82data.payloadCalculateBillingRate.total_costing_amount;
    const employeeHourlyBillingRate = TC82data.payloadCalculateBillingRate.hourly_billing_rate;
    expect(
      total_costing_amount,
      "Verify the project cost amount and employee CTC amount per hour matches for Fixed Cost Project"
    ).toBeCloseTo(employeeHourlyBillingRate, 3);
  });

  test(
    "TC83: Verify hourly consulting rate when no default billing rate is used for Retainer project   ",
    async ({ jsonDir }) => {
      allure.story("Timesheet");
      const stubPath = path.join(jsonDir, "TC83.json");
      const data = await readJSONFile(stubPath);
      const TC83data = data.TC83;
      //Assertions
      const total_costing_amount = TC83data.payloadCalculateBillingRate.total_costing_amount;
      const employeeHourlyBillingRate = TC83data.payloadCalculateBillingRate.hourly_billing_rate;

      expect(
        total_costing_amount,
        "Verify the project cost amount and employee CTC amount per hour matches for Retainer Project"
      ).toBeCloseTo(employeeHourlyBillingRate, 3);
    }
  );

  test("TC84: Verify hourly consulting rate when no default billing rate is used for Time and Material project   ", async ({
    jsonDir,
  }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC84.json");
    const data = await readJSONFile(stubPath);
    const TC84data = data.TC84;
    //Assertions
    const total_costing_amount = TC84data.payloadCalculateBillingRate.total_costing_amount;
    const employeeHourlyBillingRate = TC84data.payloadCalculateBillingRate.hourly_billing_rate;

    expect(
      total_costing_amount,
      "Verify the project cost amount and employee CTC amount per hour matches for Time and Material Project"
    ).toBeCloseTo(employeeHourlyBillingRate, 3);
  });

  test(
    "TC85: Verify hourly consulting rate when the currency for employee and project are different ",
    async ({ jsonDir }) => {
      allure.story("Timesheet");
      const stubPath = path.join(jsonDir, "TC85.json");
      const data = await readJSONFile(stubPath);
      const TC85data = data.TC85;
      //Assertions
      const total_costing_amount = TC85data.payloadCalculateBillingRate.total_costing_amount;
      const employeeHourlyBillingRate = TC85data.payloadCalculateBillingRate.hourly_billing_rate;

      expect(
        total_costing_amount,
        "Verify the project cost amount and employee CTC amount per hour matches when the currency for employee and project are different"
      ).toBeCloseTo(employeeHourlyBillingRate, 3);
    }
  );

  test("TC86: Billing rate in the timesheet should match the employee's rate from the project billing team child table for Time and Material Project", async ({
    jsonDir,
  }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC86.json");
    const data = await readJSONFile(stubPath);
    const TC86data = data.TC86;
    //Assertions
    const total_billable_amount = TC86data.payloadCalculateBillingRate.total_billable_amount;
    const hourly_billing_rate = TC86data.payloadCreateProject.custom_project_billing_team[0].hourly_billing_rate;
    expect(
      total_billable_amount,
      "Verify the billing rate for the employee should match the value provided in project billing team child table"
    ).toEqual(hourly_billing_rate);
  });

  test("TC87: Verify Default Hourly Billing Rate for Fixed Cost project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC87.json");
    const data = await readJSONFile(stubPath);
    const TC87data = data.TC87;
    //Assertions
    const total_billable_amount = TC87data.payloadCalculateBillingRate.total_billable_amount;
    const custom_default_hourly_billing_rate = TC87data.payloadCreateProject.custom_default_hourly_billing_rate;
    expect(total_billable_amount, "Verify Default Hourly Billing Rate is considered for Fixed Cost project").toEqual(
      custom_default_hourly_billing_rate
    );
  });

  test("TC88: Verify Default Hourly Billing Rate for Retainer project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC88.json");
    const data = await readJSONFile(stubPath);
    const TC88data = data.TC88;
    //Assertions
    const total_billable_amount = TC88data.payloadCalculateBillingRate.total_billable_amount;
    const custom_default_hourly_billing_rate = TC88data.payloadCreateProject.custom_default_hourly_billing_rate;
    expect(total_billable_amount, "Verify Default Hourly Billing Rate is considered for Retainer project").toEqual(
      custom_default_hourly_billing_rate
    );
  });

  test("TC89: Verify Default Hourly Billing Rate for Time and Material project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC89.json");
    const data = await readJSONFile(stubPath);
    const TC89data = data.TC89;
    //Assertions
    const total_billable_amount = TC89data.payloadCalculateBillingRate.total_billable_amount;
    const custom_default_hourly_billing_rate = TC89data.payloadCreateProject.custom_default_hourly_billing_rate;
    expect(
      total_billable_amount,
      "Verify Default Hourly Billing Rate is considered for Time and Material project"
    ).toEqual(custom_default_hourly_billing_rate);
  });

  test("TC90: Billing rate to be three times costing rate", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC90.json");
    const data = await readJSONFile(stubPath);
    const TC90data = data.TC90;
    //Assertions
    const total_billable_amount = TC90data.payloadCalculateBillingRate.total_billable_amount;
    const custom_default_hourly_billing_rate = TC90data.payloadCalculateBillingRate.total_costing_amount;
    expect(total_billable_amount, "Billing rate to be three times the costing rate").toBeCloseTo(
      3 * custom_default_hourly_billing_rate,
      1
    );
  });

  test("TC96: Verify Time entry for a Billable task under a Retainer project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC96.json");
    const data = await readJSONFile(stubPath);
    const TC96data = data.TC96;
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Assertions
    const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC96data.cell);
    expect(isTimeEntryBillable).toBeTruthy();
  });

  test("TC97: Verify Time entry for a Billable task under a Time and Material project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC97.json");
    const data = await readJSONFile(stubPath);
    const TC97data = data.TC97;
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Assertions
    const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC97data.cell);
    expect(isTimeEntryBillable).toBeTruthy();
  });

  test("TC98: Verify Time entry for a Billable task under a Non-Billable project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC98.json");
    const data = await readJSONFile(stubPath);
        const TC98data = data.TC98;
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Assertions
    const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC98data.cell);
    expect(isTimeEntryBillable).toBeTruthy();
  });

  test("TC99: Verify Time entry for a Non-Billable task under a Fixed Cost project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC99.json");
    const data = await readJSONFile(stubPath);
        const TC99data = data.TC99;
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Assertions
    const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC99data.cell);
    expect(isTimeEntryBillable).toBeFalsy();
  });

  test("TC100: Verify Time entry for a Non-Billable task under a Retainer project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC100.json");
    const data = await readJSONFile(stubPath);
    const TC100data = data.TC100;
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Assertions
    const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC100data.cell);
    expect(isTimeEntryBillable).toBeFalsy();
  });

  test("TC101: Verify Time entry for a Non-Billable task under a Time and Material project", async ({ jsonDir }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC101.json");
    const data = await readJSONFile(stubPath);
    const TC101data = data.TC101;
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Assertions
    const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC101data.cell);
    expect(isTimeEntryBillable).toBeFalsy();
  });
});
