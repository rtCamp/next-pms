import path from "path";
import { test, expect } from "@playwright/test";
import { TeamPage } from "../../pageObjects/teamPage";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import data from "../../data/manager/shared-team.json";
import { getDateForWeekday, getShortFormattedDate } from "../../utils/dateUtils";

let teamPage;
let timesheetPage;

// Load env variables
const empName = process.env.EMP_NAME;
const manName = process.env.REP_MAN_NAME;

// Load test data
let TC31data = data.TC31;
let TC34data = data.TC34;
let TC39data = data.TC39;
let TC41data = data.TC41;
let TC37data = data.TC37;
let TC75data = data.TC75;

// ------------------------------------------------------------------------------------------

// Load authentication state from 'manager.json'
test.use({ storageState: path.resolve(__dirname, "../../auth/manager.json") });

test.beforeEach(async ({ page }) => {
  // Instantiate page objects
  teamPage = new TeamPage(page);
  timesheetPage = new TimesheetPage(page);

  // Switch to Team tab
  await teamPage.goto();
});

// ------------------------------------------------------------------------------------------

test("TC30: Validate the search functionality", async ({}) => {
  // Search employee
  await teamPage.seearchEmployee(empName);

  // Assertions
  const filteredEmployees = await teamPage.getEmployees();
  expect(filteredEmployees.length).toBe(1);
  expect(filteredEmployees[0]).toBe(empName);
});

test("TC31: The reporting manager filter", async ({}) => {
  // Apply 'Reports To' filter
  await teamPage.applyReportsTo(manName);

  // Retrive employees from the parent table
  const employees = await teamPage.getEmployees();

  // Assertions
  expect(employees.sort()).toEqual(TC31data.employees.sort());
});

test("TC34: Validate the functionality of the ‘Next’ and ‘Previous’ week change buttons.", async ({}) => {
  // Navigate to the next week and fetch the column date
  await teamPage.viewNextWeek();
  const nextColDate = await teamPage.getColDate(TC34data.col);

  // Navigate to the next week again, then go back to the previous week and fetch the column date
  await teamPage.viewNextWeek();
  await teamPage.viewPreviousWeek();
  const prevColDate = await teamPage.getColDate(TC34data.col);

  // Assertions
  const expectedColDate = getShortFormattedDate(getDateForWeekday(TC34data.col)); // Compute expected column date
  expect(prevColDate).toBe(expectedColDate);
  expect(nextColDate).toBe(expectedColDate);
});

test("TC35: Validate that the timesheet dropdown section is working.", async ({}) => {
  // Toggle employee timesheet
  await teamPage.toggleEmployeeTimesheet(empName);

  // Assertions
  const isEmployeeTimesheetVisible = await teamPage.isEmployeeTimesheetVisible(empName);
  expect(isEmployeeTimesheetVisible).toBeTruthy();
});

test("TC36: Validate the timesheets for individual employees for all weeks.", async ({}) => {
  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(empName);
});

test("TC37: Change the employee selected from the top search and verify that the timesheets below are updated accordingly.", async ({}) => {
  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Select a different employee
  await timesheetPage.selectEmployee(TC37data.employee);

  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(TC37data.employee);
});

test("TC39: Validate the modification of the employee timesheet or the deletion of time entries.", async ({ page }) => {
  // View next week
  await teamPage.viewNextWeek();

  // Open employee timesheet pane
  await teamPage.openReviewTimesheetPane(empName);

  // Update time entry's duration
  const date = getShortFormattedDate(getDateForWeekday(TC39data.cell.col));
  await teamPage.updateDurationOfTimeEntry({
    date: date,
    project: TC39data.taskInfo.project,
    task: TC39data.taskInfo.task,
    newDuration: TC39data.taskInfo.duration,
  });

  // Reload page to ensure changes are reflected
  await page.reload();

  // View next week
  await teamPage.viewNextWeek();

  // Toggle employee timesheet
  await teamPage.toggleEmployeeTimesheet(empName);

  // Assertions
  const cellText = await timesheetPage.getCellText({
    employee: empName,
    rowName: TC39data.cell.rowName,
    col: TC39data.cell.col,
  });
  expect(cellText).toContain(TC39data.taskInfo.duration);
});

test("TC41: Rejecting timesheet for the employee", async ({ page }) => {
  // View next week
  await teamPage.viewNextWeek();

  // Reject timesheet
  await teamPage.rejectTimesheet({ employee: empName, reason: TC41data.reason });

  // Reload page to ensure changes are reflected
  await page.reload();

  // View next week
  await teamPage.viewNextWeek();

  // Get timesheet status
  const status = await teamPage.getTimesheetStatus(empName);

  // Assertions
  expect(status).toBe("Rejected");
});

test("TC75: Verify the manager view.", async ({}) => {
  // Retrive employees from the parent table
  const employees = await teamPage.getEmployees();

  // Assertions
  expect(employees.sort()).toEqual(TC75data.employees.sort());
});
