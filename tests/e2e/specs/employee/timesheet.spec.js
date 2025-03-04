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
import data from "../../data/employee/timesheet.json";

let timesheetPage;
let formattedDate;
let filteredTimeEntry = {};

// Load env variables
const empID = process.env.EMP_ID;
const empEmail = process.env.EMP_EMAIL;
const empPass = process.env.EMP_PASS;

// Load test data
let TC2data = data.TC2;
let TC3data = data.TC3;
let TC4data = data.TC4;
let TC5data = data.TC5;
let TC6data = data.TC6;

test.beforeAll("Before All - Create time entries", async ({}) => {
  // Fetch TC2 task and update dynamic fields
  TC2data.cell.col = getWeekdayName(new Date()); // Get today's weekday name

  formattedDate = getFormattedDate(getDateForWeekday(TC2data.cell.col));

  TC2data.payloadFilterTimeEntry.from_time = formattedDate;
  TC2data.payloadFilterTimeEntry.employee = empID;

  // Fetch TC3 task and update dynamic fields
  formattedDate = getFormattedDate(getDateForWeekday(TC3data.cell.col));

  TC3data.payloadFilterTimeEntry.from_time = formattedDate;
  TC3data.payloadFilterTimeEntry.employee = empID;

  // Fetch TC4 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(TC4data.cell.col));

  TC4data.payloadCreateTimesheet.date = formattedDate;
  TC4data.payloadCreateTimesheet.employee = empID;
  TC4data.payloadFilterTimeEntry1.from_time = formattedDate;
  TC4data.payloadFilterTimeEntry1.employee = empID;
  TC4data.payloadFilterTimeEntry2.from_time = formattedDate;
  TC4data.payloadFilterTimeEntry2.employee = empID;

  await createTimesheet(TC4data.payloadCreateTimesheet);

  // Fetch TC5 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(TC5data.cell.col));

  TC5data.payloadCreateTimesheet.date = formattedDate;
  TC5data.payloadCreateTimesheet.employee = empID;
  TC5data.payloadFilterTimeEntry1.from_time = formattedDate;
  TC5data.payloadFilterTimeEntry1.employee = empID;
  TC5data.payloadFilterTimeEntry2.from_time = formattedDate;
  TC5data.payloadFilterTimeEntry2.employee = empID;

  await createTimesheet(TC5data.payloadCreateTimesheet);

  // Fetch TC6 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(TC6data.cell.col));

  TC6data.payloadCreateTimesheet.date = formattedDate;
  TC6data.payloadCreateTimesheet.employee = empID;
  TC6data.payloadFilterTimeEntry.from_time = formattedDate;
  TC6data.payloadFilterTimeEntry.employee = empID;

  await createTimesheet(TC6data.payloadCreateTimesheet);
});

// ------------------------------------------------------------------------------------------

test.afterAll("After All - Delete time entries", async ({}) => {
  // Fetch TC2 time entry, update dynamic fields and delete time entry
  filteredTimeEntry = await filterTimesheetEntry(TC2data.payloadFilterTimeEntry);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });

  // Fetch TC3 time entry, update dynamic fields and delete time entry
  filteredTimeEntry = await filterTimesheetEntry(TC3data.payloadFilterTimeEntry);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });

  // Fetch TC4 time entries, update dynamic fields and delete time entries
  filteredTimeEntry = await filterTimesheetEntry(TC4data.payloadFilterTimeEntry1);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });

  filteredTimeEntry = await filterTimesheetEntry(TC5data.payloadFilterTimeEntry2);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });

  // Fetch TC5 time entries, update dynamic fields and delete time entries
  filteredTimeEntry = await filterTimesheetEntry(TC5data.payloadFilterTimeEntry1);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });

  filteredTimeEntry = await filterTimesheetEntry(TC5data.payloadFilterTimeEntry2);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });

  // Fetch TC6 time entry, update dynamic fields and delete time entry
  filteredTimeEntry = await filterTimesheetEntry(TC6data.payloadFilterTimeEntry);
  await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });
});

// ------------------------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  // Login to Next PMS
  await loginNextPMS(page, empEmail, empPass);
  timesheetPage = new TimesheetPage(page);
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
  // Wait for 1 second
  await page.waitForTimeout(1000);

  // Reload page to ensure changes are reflected
  await page.reload();

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
