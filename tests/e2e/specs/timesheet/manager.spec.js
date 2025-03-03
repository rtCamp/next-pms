import { test, expect } from "@playwright/test";
import { loginNextPMS } from "../../helpers/loginHelper";
import { TeamPage } from "../../pages/teamPage";
import { TimesheetPage } from "../../pages/timesheetPage";

let teamPage;
let timesheetPage;

const repManID = process.env.REP_MAN_ID;
const repManEmail = process.env.REP_MAN_EMAIL;
const repManPass = process.env.REP_MAN_PASS;
const empID = process.env.EMP_ID;
const empName = process.env.EMP_NAME;

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
  // Define Employee
  const employee = "Abhishek Sharma";

  // Switch to Team tab
  await teamPage.goto();

  // Navigate to employee's timesheet
  await teamPage.navigateToEmpTimesheet(empName);

  // Select a different employee
  await timesheetPage.selectEmployee(employee);

  // Assertions
  const selectedEmployee = await timesheetPage.getSelectedEmployee();
  expect(selectedEmployee).toContain(employee);
});
