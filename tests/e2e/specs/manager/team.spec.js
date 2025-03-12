import path from "path";
import { test, expect } from "@playwright/test";
import { TeamPage } from "../../pageObjects/teamPage";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import data from "../../data/manager/team.json";

let teamPage;
let timesheetPage;

// Load env variables
const empName = process.env.EMP_NAME;
const manName = process.env.REP_MAN_NAME;

// Load test data
let TC31data = data.TC31;
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

test("TC75: Verify the manager view.", async ({}) => {
  // Retrive employees from the parent table
  const employees = await teamPage.getEmployees();

  // Assertions
  expect(employees.sort()).toEqual(TC75data.employees.sort());
});
