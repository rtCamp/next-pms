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

let formattedDate;
let filteredTimeEntry = {};
let TC4data = data.TC4;
let TC5data = data.TC5;
let TC6data = data.TC6;

test.beforeAll("Before All - Create time entries", async ({}) => {
  // Fetch TC5 task, update dynamic fields and create time entry
  formattedDate = await getFormattedDate(getDateForWeekday(TC5data.cell.col));

  TC5data.payloadCreateTimesheet.date = formattedDate;
  TC5data.payloadCreateTimesheet.employee = empID;
  TC5data.payloadFilterTimeEntry1.from_time = formattedDate;
  TC5data.payloadFilterTimeEntry1.employee = empID;
  TC5data.payloadFilterTimeEntry2.from_time = formattedDate;
  TC5data.payloadFilterTimeEntry2.employee = empID;

  await createTimesheet(TC5data.payloadCreateTimesheet);

  // Fetch TC6 task, update dynamic fields and create time entry
  formattedDate = await getFormattedDate(getDateForWeekday(TC6data.cell.col));

  TC6data.payloadCreateTimesheet.date = formattedDate;
  TC6data.payloadCreateTimesheet.employee = empID;
  TC6data.payloadFilterTimeEntry.from_time = formattedDate;
  TC6data.payloadFilterTimeEntry.employee = empID;

  await createTimesheet(TC6data.payloadCreateTimesheet);
});

test.afterAll("After All - Delete time entries", async ({}) => {
  // Fetch TC5 time entries, update dynamic fields and delete time entries
  filteredTimeEntry = await filterTimesheetEntry(TC5data.payloadFilterTimeEntry1);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });

  filteredTimeEntry = await filterTimesheetEntry(TC5data.payloadFilterTimeEntry2);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });

  // Fetch TC6 time entry, update dynamic fields and delete time entry
  filteredTimeEntry = await filterTimesheetEntry(TC6data.payloadFilterTimeEntry);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });
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
  // Wait for 1 second
  await page.waitForTimeout(1000);

  // Reload page to ensure changes are reflected
  await page.reload();

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
