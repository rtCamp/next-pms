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
let TC37data = data.TC37;
let TC40data = data.TC40;
let TC43data = data.TC43;
let TC45data = data.TC45;
let TC47data = data.TC47;
let TC48data = data.TC48;
let TC51data = data.TC51;

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

test("TC36: Validate the search functionality", async ({}) => {
  // Search employee
  await teamPage.searchEmployee(empName);

  // Assertions
  const filteredEmployees = await teamPage.getEmployees();
  expect(filteredEmployees.length).toBe(1);
  expect(filteredEmployees[0]).toBe(empName);
});

test("TC37: The reporting manager filter", async ({}) => {
  // Apply 'Reports To' filter
  await teamPage.applyReportsTo(manName);

  // Retrive employees from the parent table
  const employees = await teamPage.getEmployees();

  // Assertions
  expect(employees.sort()).toEqual(TC37data.employees.sort());
});

test("TC40: Validate the functionality of the ‘Next’ and ‘Previous’ week change buttons.", async ({}) => {
  // Navigate to the next week and fetch the column date
  await teamPage.viewNextWeek();
  const nextColDate = await teamPage.getColDate(TC40data.col);

  // Navigate to the next week again, then go back to the previous week and fetch the column date
  await teamPage.viewNextWeek();
  await teamPage.viewPreviousWeek();
  const prevColDate = await teamPage.getColDate(TC40data.col);

  // Assertions
  const expectedColDate = getShortFormattedDate(getDateForWeekday(TC40data.col)); // Compute expected column date
  expect(prevColDate).toBe(expectedColDate);
  expect(nextColDate).toBe(expectedColDate);
});

test("TC41: Validate that the timesheet dropdown section is working.", async ({}) => {
  // Toggle employee timesheet
  await teamPage.toggleEmployeeTimesheet(empName);

  // Assertions
  const isEmployeeTimesheetVisible = await teamPage.isEmployeeTimesheetVisible(empName);
  expect(isEmployeeTimesheetVisible).toBeTruthy();
});

test("TC42: Validate the timesheets for individual employees for all weeks.", async ({}) => {
  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(empName);
});

test("TC43: Change the employee selected from the top search and verify that the timesheets below are updated accordingly.", async ({}) => {
  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Select a different employee
  await timesheetPage.selectEmployee(TC43data.employee);

  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(TC43data.employee);
});

test("TC45: Validate the modification of the employee timesheet or the deletion of time entries.", async ({ page }) => {
  // View next week
  await teamPage.viewNextWeek();

  // Open employee timesheet pane
  await teamPage.openReviewTimesheetPane(empName);

  // Update time entry's duration
  const date = getShortFormattedDate(getDateForWeekday(TC45data.cell.col));
  await teamPage.updateDurationOfTimeEntry({
    date: date,
    project: TC45data.taskInfo.project,
    task: TC45data.taskInfo.task,
    desc: TC45data.taskInfo.desc,
    newDuration: TC45data.taskInfo.duration,
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
    rowName: TC45data.cell.rowName,
    col: TC45data.cell.col,
  });
  expect(cellText).toContain(TC45data.taskInfo.duration);
});

test("TC47: Rejecting timesheet for the employee", async ({ page }) => {
  // View next week
  await teamPage.viewNextWeek();

  // Reject timesheet
  await teamPage.rejectTimesheet({ employee: empName, reason: TC47data.reason });

  // Reload page to ensure changes are reflected
  await page.reload();

  // View next week
  await teamPage.viewNextWeek();

  // Get timesheet status
  const status = await teamPage.getTimesheetStatus(empName);

  // Assertions
  expect(status).toBe("Rejected");
});

test("TC48: Open task details popup", async ({}) => {
  // View next week
  await teamPage.viewNextWeek();

  // Toggle employee timesheet
  await teamPage.toggleEmployeeTimesheet(empName);

  // Open task details
  await teamPage.openTaskDetails({ employee: empName, task: TC48data.task });

  // Assertions
  const isTaskDetailsDialogVisible = await teamPage.isTaskDetailsDialogVisible(TC48data.task);
  expect(isTaskDetailsDialogVisible).toBeTruthy();
});

test("TC51: Verify the manager view.", async ({}) => {
  // Retrive employees from the parent table
  const employees = await teamPage.getEmployees();

  // Assertions
  expect(employees.sort()).toEqual(TC51data.employees.sort());
});
