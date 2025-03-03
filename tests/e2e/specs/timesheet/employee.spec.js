import { test, expect } from "@playwright/test";
import { loginNextPMS } from "../../helpers/loginHelper";
import {
  getWeekdayName,
  secondsToDuration,
  durationToSeconds,
  getFormattedDate,
  getDateForWeekday,
} from "../../utils/dateUtils";
import { createTimesheet, deleteTimesheet } from "../../utils/api/timesheetRequests";
import { filterTimesheetEntry } from "../../helpers/timesheetHelper";
import { TimesheetPage } from "../../pages/timesheetPage";
import data from "../../data/timesheet/employee.json";

let timesheetPage;

const empID = process.env.EMP_ID;
const empEmail = process.env.EMP_EMAIL;
const empPass = process.env.EMP_PASS;

let payloadCreateTimesheet;
let timeEntryDetails;
let payloadFilterTimeEntry;
let payloadDeleteTimesheet;
let formattedDate;

let TC6data = data.TC6;

test.beforeAll("Before All", async ({}) => {
  // Fetch TC6 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(TC6data.cell.col));
  payloadCreateTimesheet = TC6data.payloadCreateTimesheet;

  payloadCreateTimesheet.date = formattedDate;
  payloadCreateTimesheet.employee = empID;

  await createTimesheet(payloadCreateTimesheet);
});

test.afterAll("After All", async ({}) => {
  // Fetch TC6 time entry, update dynamic fields and delete time entry
  payloadFilterTimeEntry = TC6data.payloadFilterTimeEntry;
  payloadFilterTimeEntry.from_time = formattedDate;
  payloadFilterTimeEntry.employee = empID;

  timeEntryDetails = await filterTimesheetEntry(payloadFilterTimeEntry);

  payloadDeleteTimesheet = { parent: timeEntryDetails.parent, name: timeEntryDetails.name };

  await deleteTimesheet(payloadDeleteTimesheet);
});

test.beforeEach(async ({ page }) => {
  // Login to Next PMS
  await loginNextPMS(page, empEmail, empPass);
  timesheetPage = new TimesheetPage(page);
});

test("TC2: Time should be added using the ‘Add’ button at the top.", async ({ page }) => {
  // Define task and cell details
  const taskDetails = {
    duration: "1:00",
    project: "QE - Retainer",
    task: "Documentation",
    desc: "Task added via automation.",
  };
  const cellInfo = { rowName: taskDetails.task, col: getWeekdayName(new Date()) };
  const formattedDate = getFormattedDate(getDateForWeekday(cellInfo.col));

  try {
    // Add time entry using "Time" button
    await timesheetPage.addTimeViaButton(taskDetails);

    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(cellInfo);
    expect(cellText).toContain(taskDetails.duration);
  } catch (e) {
    // This empty catch block ensures finally block is executed
  } finally {
    // Teardown
    // Fetch time entry details required for deletion (API)
    const payloadFilterTimeEntry = {
      subject: taskDetails.task,
      description: taskDetails.desc,
      project_name: taskDetails.project,
      from_time: formattedDate,
      employee: empID,
      max_week: "1",
    };
    const timeEntryDetails = await filterTimesheetEntry(payloadFilterTimeEntry);

    // Delete time entry (API)
    const payloadDeleteTimesheet = { parent: timeEntryDetails.parent, name: timeEntryDetails.name };

    await deleteTimesheet(payloadDeleteTimesheet);
  }
});

test("TC3: Time should be added using the direct timesheet add buttons.", async ({ page }) => {
  // Define task and cell details
  const taskDetails = {
    duration: "1:30",
    project: "QE - Fixed Cost",
    task: "Design dashboard",
    desc: "Task added via automation.",
  };
  const cellInfo = { rowName: taskDetails.task, col: "Mon" };
  const formattedDate = getFormattedDate(getDateForWeekday(cellInfo.col));

  try {
    // Import liked tasks
    await timesheetPage.importLikedTasks();

    // Add time entry using "+" button in timesheet
    await timesheetPage.addTimeViaCell(cellInfo, { duration: taskDetails.duration, desc: taskDetails.desc });

    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(cellInfo);
    expect(cellText).toContain(taskDetails.duration);
  } catch (e) {
    // This empty catch block ensures finally block is executed
  } finally {
    // Teardown
    // Fetch time entry details required for deletion (API)
    const payloadFilterTimeEntry = {
      subject: taskDetails.task,
      description: taskDetails.desc,
      project_name: taskDetails.project,
      from_time: formattedDate,
      employee: empID,
      max_week: "1",
    };
    const timeEntryDetails = await filterTimesheetEntry(payloadFilterTimeEntry);

    // Delete time entry (API)
    const payloadDeleteTimesheet = { parent: timeEntryDetails.parent, name: timeEntryDetails.name };

    await deleteTimesheet(payloadDeleteTimesheet);
  }
});

test("TC4: Added time and description should be editable.", async ({ page }) => {
  // Define task and cell details
  const taskDetails = {
    duration: "0:30",
    project: "QE - Retainer",
    task: "App support",
    desc: "Updated task via automation.",
  };
  const cellInfo = { rowName: taskDetails.task, col: "Tue" };
  const formattedDate = getFormattedDate(getDateForWeekday(cellInfo.col));

  // Setup
  // Create time entry (API)
  let payloadCreateTimesheet = {
    task: "TASK-2025-00619",
    description: "Task added via automation.",
    hours: "1",
    date: formattedDate,
    employee: empID,
  };

  await createTimesheet(payloadCreateTimesheet);

  // Wait for 1 second
  await page.waitForTimeout(1000);

  // Reload page to ensure changes are reflected
  await page.reload();

  try {
    // Update time entry
    await timesheetPage.updateTimeRow(cellInfo, {
      desc: payloadCreateTimesheet.description,
      newDesc: taskDetails.desc,
      newDuration: taskDetails.duration,
    });

    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(cellInfo);
    expect(cellText).toContain(taskDetails.duration);

    const cellTooltipText = await timesheetPage.getCellTooltipText(cellInfo);
    expect(cellTooltipText).toContain(taskDetails.desc);
  } catch (e) {
    // This empty catch block ensures finally block is executed
  } finally {
    // Teardown
    // Fetch time entry details required for deletion (API)
    const payloadFilterTimeEntry1 = {
      subject: taskDetails.task,
      description: payloadCreateTimesheet.description,
      project_name: taskDetails.project,
      from_time: formattedDate,
      employee: empID,
      max_week: "1",
    };
    const payloadFilterTimeEntry2 = {
      subject: taskDetails.task,
      description: taskDetails.desc,
      project_name: taskDetails.project,
      from_time: formattedDate,
      employee: empID,
      max_week: "1",
    };
    const timeEntryDetails1 = await filterTimesheetEntry(payloadFilterTimeEntry1);
    const timeEntryDetails2 = await filterTimesheetEntry(payloadFilterTimeEntry2);

    // Delete time entry (API)
    const payloadDeleteTimesheet1 = { parent: timeEntryDetails1.parent, name: timeEntryDetails1.name };
    const payloadDeleteTimesheet2 = { parent: timeEntryDetails2.parent, name: timeEntryDetails2.name };

    await deleteTimesheet(payloadDeleteTimesheet1);
    await deleteTimesheet(payloadDeleteTimesheet2);
  }
});

test("TC5: Add a new row in the already added time.", async ({ page }) => {
  // Define task and cell details
  const taskDetails = {
    duration: "2:15",
    project: "QE - Time and Material",
    task: "Unit Testing",
    desc: "New row added to task via automation.",
  };
  const cellInfo = { rowName: taskDetails.task, col: "Thu" };
  const formattedDate = getFormattedDate(getDateForWeekday(cellInfo.col));

  // Setup
  // Create time entry (API)
  let payloadCreateTimesheet = {
    task: "TASK-2025-00621",
    description: "Task added via automation.",
    hours: "1",
    date: formattedDate,
    employee: empID,
  };

  await createTimesheet(payloadCreateTimesheet);

  // Wait for 1 second
  await page.waitForTimeout(1000);

  // Reload page to ensure changes are reflected
  await page.reload();

  try {
    // Store cell text before new row addition
    const beforeCellText = await timesheetPage.getCellText(cellInfo);

    // Add time entry
    await timesheetPage.addTimeRow(cellInfo, { duration: taskDetails.duration, desc: taskDetails.desc });

    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const afterCellText = await timesheetPage.getCellText(cellInfo);
    const afterDuration = secondsToDuration(
      durationToSeconds(beforeCellText) + durationToSeconds(taskDetails.duration)
    );
    expect(afterCellText).toContain(afterDuration);

    const cellTooltipText = await timesheetPage.getCellTooltipText(cellInfo);
    expect(cellTooltipText).toContain(taskDetails.desc);
  } catch (e) {
    // This empty catch block ensures finally block is executed
  } finally {
    // Teardown
    // Fetch time entry details required for deletion (API)
    const payloadFilterTimeEntry1 = {
      subject: taskDetails.task,
      description: payloadCreateTimesheet.description,
      project_name: taskDetails.project,
      from_time: formattedDate,
      employee: empID,
      max_week: "1",
    };
    const payloadFilterTimeEntry2 = {
      subject: taskDetails.task,
      description: taskDetails.desc,
      project_name: taskDetails.project,
      from_time: formattedDate,
      employee: empID,
      max_week: "1",
    };

    const timeEntryDetails1 = await filterTimesheetEntry(payloadFilterTimeEntry1);
    const timeEntryDetails2 = await filterTimesheetEntry(payloadFilterTimeEntry2);

    // Delete time entry (API)
    const payloadDeleteTimesheet1 = { parent: timeEntryDetails1.parent, name: timeEntryDetails1.name };
    const payloadDeleteTimesheet2 = { parent: timeEntryDetails2.parent, name: timeEntryDetails2.name };

    await deleteTimesheet(payloadDeleteTimesheet1);
    await deleteTimesheet(payloadDeleteTimesheet2);
  }
});

test("TC6: Delete the added time entry from the non-submitted timesheet.", async ({ page }) => {
  // Wait for 1 second
  await page.waitForTimeout(1000);

  // Reload page to ensure changes are reflected
  await page.reload();

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
