import path from "path";
import fs from "fs";
import { test, expect } from "@playwright/test";
import { getWeekdayName } from "../../utils/dateUtils";
import { secondsToDuration, durationToSeconds } from "../../utils/dateUtils";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import data from "../../data/employee/shared-timesheet.json";

const employeeTimesheetDataFilePath = path.resolve(__dirname, "../../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file
//add type hints to help VS Code recognize TimesheetPage
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

// ------------------------------------------------------------------------------------------

test.beforeAll(async ({}) => {
  // Compute cell info for TC13
  data.TC13.cell.col = getWeekdayName(new Date()); // Get today's weekday name

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

test("TC24: Verify task addition", async ({}) => {
  // Add a task
  await timesheetPage.importLikedTasks();

  // Assertions
  const isTimeEntryBillable = await timesheetPage.isTimeEntryBillable(TC15data.cell);
  expect(isTimeEntryBillable).toBeFalsy();
});
