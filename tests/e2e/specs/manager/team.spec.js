import path from "path";
import { test, expect } from "@playwright/test";
import { TeamPage } from "../../pageObjects/teamPage";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import data from "../../data/manager/shared-team.json";
import { getDateForWeekday, getShortFormattedDate } from "../../utils/dateUtils";
import * as allure from "allure-js-commons";
//Add type hints to help VS Code recognize TaskPage
/** @type {TeamPage} */

let teamPage;
let timesheetPage;

// Load env variables
const empName = process.env.EMP_NAME;
const manName = process.env.REP_MAN_NAME;

// Load test data
let TC39data = data.TC39;
let TC42data = data.TC42;
let TC45data = data.TC45;
let TC47data = data.TC47;
let TC49data = data.TC49;
let TC50data = data.TC50;
let TC53data = data.TC53;

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

test("TC38: Validate the search functionality   ", async ({}) => {
  allure.story("Team");
  // Search employee
  await teamPage.searchEmployee(empName);

  // Assertions
  const filteredEmployees = await teamPage.getEmployees();
  expect(filteredEmployees.length).toBe(1);
  expect(filteredEmployees[0]).toBe(empName);
});

test("TC39: The reporting manager filter   ", async ({}) => {
  allure.story("Team");
  // Apply 'Reports To' filter
  await teamPage.applyReportsTo(manName);

  // Retrive employees from the parent table
  const employees = await teamPage.getEmployees();

  // Assertions
  expect(employees.sort()).toEqual(TC39data.employees.sort());
});

test("TC42: Validate the functionality of the ‘Next’ and ‘Previous’ week change buttons.   ", async ({}) => {
  allure.story("Team");
  // Navigate to the next week and fetch the column date
  await teamPage.viewNextWeek();
  const nextColDate = await teamPage.getColDate(TC42data.col);

  // Navigate to the next week again, then go back to the previous week and fetch the column date
  await teamPage.viewNextWeek();
  await teamPage.viewPreviousWeek();
  const prevColDate = await teamPage.getColDate(TC42data.col);

  // Assertions
  const expectedColDate = getShortFormattedDate(getDateForWeekday(TC42data.col)); // Compute expected column date
  expect(prevColDate).toBe(expectedColDate);
  expect(nextColDate).toBe(expectedColDate);
});

test("TC43: Validate that the timesheet dropdown section is working.   ", async ({}) => {
  allure.story("Team");
  // Toggle employee timesheet
  await teamPage.toggleEmployeeTimesheet(empName);

  // Assertions
  const isEmployeeTimesheetVisible = await teamPage.isEmployeeTimesheetVisible(empName);
  expect(isEmployeeTimesheetVisible).toBeTruthy();
});

test("TC44: Validate the timesheets for individual employees for all weeks.   ", async ({}) => {
  allure.story("Team");
  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(empName);
});

test("TC45: Change the employee selected from the top search and verify that the timesheets below are updated accordingly.   ", async ({}) => {
  allure.story("Team");
  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Select a different employee
  await timesheetPage.selectEmployee(TC45data.employee);
  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(TC45data.employee);
});

test("TC47: Validate the modification of the employee timesheet or the deletion of time entries.   ", async ({
  page,
}) => {
  allure.story("Team");
  // View next week
  await teamPage.viewNextWeek();

  // Open employee timesheet pane
  await teamPage.openReviewTimesheetPane(empName);

  // Update time entry's duration
  const date = getShortFormattedDate(getDateForWeekday(TC47data.cell.col));
  await teamPage.updateDurationOfTimeEntry({
    date: date,
    project: TC47data.taskInfo.project,
    task: TC47data.taskInfo.task,
    desc: TC47data.taskInfo.desc,
    newDuration: TC47data.taskInfo.duration,
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
    rowName: TC47data.cell.rowName,
    col: TC47data.cell.col,
  });
  expect(cellText).toContain(TC47data.taskInfo.duration);
});

test("TC49: Rejecting timesheet for the employee   ", async ({ page }) => {
  allure.story("Team");
  // View next week
  await teamPage.viewNextWeek();

  // Reject timesheet
  await teamPage.rejectTimesheet({ employee: empName, reason: TC49data.reason });

  // Reload page to ensure changes are reflected
  await page.reload();

  // View next week
  await teamPage.viewNextWeek();

  // Get timesheet status
  const status = await teamPage.getTimesheetStatus(empName);

  // Assertions
  expect(status).toBe("Rejected");
});

test("TC50: Open task details popup   ", async ({}) => {
  allure.story("Team");
  // View next week
  await teamPage.viewNextWeek();

  // Toggle employee timesheet
  await teamPage.toggleEmployeeTimesheet(empName);

  // Open task details
  await teamPage.openTaskDetails({ employee: empName, task: TC50data.payloadCreateTask.subject });

  // Assertions
  const isTaskDetailsDialogVisible = await teamPage.isTaskDetailsDialogVisible(TC50data.task);
  expect(isTaskDetailsDialogVisible).toBeTruthy();
});

test("TC53: Verify the manager view.   ", async ({}) => {
  allure.story("Team");
  // Retrive employees from the parent table
  const employees = await teamPage.getEmployees();

  // Assertions
  expect(employees.sort()).toEqual(TC53data.employees.sort());
});
