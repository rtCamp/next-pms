import { test, expect } from "@playwright/test";
import { loginNextPMS } from "../../helpers/loginHelper";
import { TeamPage } from "../../pages/teamPage";
import { TimesheetPage } from "../../pages/timesheetPage";
import data from "../../data/manager/timesheet.json";

let teamPage;
let timesheetPage;

// Load env variables
const repManEmail = process.env.REP_MAN_EMAIL;
const repManPass = process.env.REP_MAN_PASS;
const empName = process.env.EMP_NAME;

// Load test data
let TC37data = data.TC37;

test.beforeEach(async ({ page }) => {
  // Login to Next PMS
  await loginNextPMS(page, repManEmail, repManPass);
  teamPage = new TeamPage(page);
  timesheetPage = new TimesheetPage(page);
});

test("TC36: Validate the timesheets for individual employees for all weeks.", async ({ page }) => {
  // Switch to Team tab
  await teamPage.goto();

  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Wait for 1 second
  await page.waitForTimeout(1000);

  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(empName);
});

test("TC37: Change the employee selected from the top search and verify that the timesheets below are updated accordingly.", async () => {
  // Switch to Team tab
  await teamPage.goto();

  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Select a different employee
  await timesheetPage.selectEmployee(TC37data.employee);

  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(TC37data.employee);
});
