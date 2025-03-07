import { test, expect } from "@playwright/test";
import { loginNextPMS } from "../../helpers/loginHelper";
import { TeamPage } from "../../pageObjects/teamPage";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import data from "../../data/manager/team.json";

let teamPage;
let timesheetPage;

// Load env variables
const repManEmail = process.env.REP_MAN_EMAIL;
const repManPass = process.env.REP_MAN_PASS;
const empName = process.env.EMP_NAME;

// Load test data
let TC30data = data.TC30;
let TC37data = data.TC37;
let TC76data = data.TC76;

// ------------------------------------------------------------------------------------------

test.beforeEach(async ({ page, context }) => {
  // Clear cookies to remove session state
  await context.clearCookies();

  // Login
  await loginNextPMS(page, repManEmail, repManPass);

  // Instantiate page objects
  teamPage = new TeamPage(page);
  timesheetPage = new TimesheetPage(page);

  // Switch to Team tab
  await teamPage.goto();
});

// ------------------------------------------------------------------------------------------

test("TC30: Validate the search functionality", async ({}) => {
  // Search employee
  await teamPage.seearchEmployee(TC30data.employee);

  // Assertions
  const filteredEmployees = await teamPage.getEmployees();
  expect(filteredEmployees.length).toBe(1);
  expect(filteredEmployees[0]).toBe(TC30data.employee);
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

test("TC76: Verify the manager view.", async ({}) => {
  // Retrive employees from the parent table
  const employees = await teamPage.getEmployees();

  // Assertions
  expect(employees.sort()).toEqual(TC76data.employees.sort());
});
