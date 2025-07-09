import path from "path";
const { test, expect } = require("../../playwright.fixture.cjs");
import { TeamPage } from "../../pageObjects/teamPage";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
//import data from "../../data/manager/shared-team.json";
import { getDateForWeekday, getShortFormattedDate } from "../../utils/dateUtils";
import * as allure from "allure-js-commons";
import { readJSONFile } from "../../utils/fileUtils";
//Add type hints to help VS Code recognize TaskPage
/** @type {TeamPage} */

let teamPage;
/** @type {TimesheetPage} */
let timesheetPage;

// Load env variables
const empName = process.env.EMP_NAME;
const manName = process.env.REP_MAN_NAME;
const emp3Name = process.env.EMP3_NAME;

// Load test data
/*
let TC39data = data.TC39;
let TC42data = data.TC42;
let TC45data = data.TC45;
let TC47data = data.TC47;
let TC49data = data.TC49;
let TC50data = data.TC50;
let TC53data = data.TC53;
let TC91data = data.TC91;
let TC92data = data.TC92;
let TC93data = data.TC93;
let TC94data = data.TC94;
*/
// ------------------------------------------------------------------------------------------

// Load authentication state from 'manager.json'
test.use({ storageState: path.resolve(__dirname, "../../auth/manager.json") });
// switch to employee2 session
//test.use({ role: 'manager' });

test.describe("Manager: Team Tab", () => {
  test.beforeEach(async ({ page }) => {
    teamPage = new TeamPage(page);
    timesheetPage = new TimesheetPage(page);
    await teamPage.goto();
  });

  test("TC38: Validate the search functionality", async ({}) => {
    allure.story("Team");
    await teamPage.searchEmployee(empName);
    const filteredEmployees = await teamPage.getEmployees();
    expect(filteredEmployees.length).toBe(1);
    expect(filteredEmployees[0]).toBe(empName);
  });

  test("TC39: The reporting manager filter", async ({}) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC39.json");
    const TC39data = data.TC39;
    await teamPage.applyReportsTo(manName);
    const employees = await teamPage.getEmployees();
    for (const expectedEmployee of TC39data.employees) {
      expect(employees).toContain(expectedEmployee);
    }
  });

  test("TC42: Validate Next/Previous week change buttons", async ({}) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC42.json");
    const TC42data = data.TC42;
    await teamPage.viewNextWeek();
    const nextColDate = await teamPage.getColDate(TC42data.col);
    await teamPage.viewNextWeek();
    await teamPage.viewPreviousWeek();
    const prevColDate = await teamPage.getColDate(TC42data.col);
    const expectedColDate = getShortFormattedDate(getDateForWeekday(TC42data.col));
    expect(prevColDate).toBe(expectedColDate);
    expect(nextColDate).toBe(expectedColDate);
  });

  test("TC43: Timesheet dropdown section is working", async ({}) => {
    allure.story("Team");

    await teamPage.toggleEmployeeTimesheet(empName);
    const isVisible = await teamPage.isEmployeeTimesheetVisible(empName);
    expect(isVisible).toBeTruthy();
  });

  test("TC44: Timesheets for employees for all weeks", async ({}) => {
    allure.story("Team");
    await teamPage.navigateToEmpTimesheet(empName);
    const selectedEmployee = await timesheetPage.getSelectedEmployee();
    expect(selectedEmployee).toContain(empName);
  });

  test("TC45: Change selected employee and verify timesheets update", async ({}) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC45.json");
    const TC45data = data.TC45;
    await teamPage.navigateToEmpTimesheet(empName);
    await timesheetPage.selectEmployee(TC45data.employee);
    const selectedEmployee = await timesheetPage.getSelectedEmployee();
    expect(selectedEmployee).toContain(TC45data.employee);
  });

  test("TC47: Modify or delete employee time entries", async ({ page }) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC47.json");
    const TC47data = data.TC47;
    await teamPage.viewNextWeek();
    await teamPage.openReviewTimesheetPane(empName);
    const date = getShortFormattedDate(getDateForWeekday(TC47data.cell.col));
    await teamPage.updateDurationOfTimeEntry({
      date,
      project: TC47data.taskInfo.project,
      task: TC47data.taskInfo.task,
      desc: TC47data.taskInfo.desc,
      newDuration: TC47data.taskInfo.duration,
    });
    await page.reload();
    await teamPage.viewNextWeek();
    await teamPage.searchEmployee(empName);
    await teamPage.toggleEmployeeTimesheet(empName);
    const cellText = await timesheetPage.getCellText({
      employee: empName,
      rowName: TC47data.cell.rowName,
      col: TC47data.cell.col,
    });
    expect(cellText).toContain(TC47data.taskInfo.duration);
  });

  test("TC49: Reject timesheet for employee", async ({ page }) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC49.json");
    const TC49data = data.TC49;
    await teamPage.viewNextWeek();
    await teamPage.rejectTimesheet({
      employee: empName,
      reason: TC49data.reason,
      notification: TC49data.notification,
    });
    await page.reload();
    await teamPage.viewNextWeek();
    const status = await teamPage.getTimesheetStatus(empName);
    expect(status).toBe("Rejected");
  });

  test("TC50: Open task details popup", async ({}) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC50.json");
    const TC50data = data.TC50;
    await teamPage.viewNextWeek();
    await teamPage.toggleEmployeeTimesheet(empName);
    await teamPage.openTaskDetails({
      employee: empName,
      task: TC50data.payloadCreateTask.subject,
    });
    const isDialogVisible = await teamPage.isTaskDetailsDialogVisible(TC50data.task);
    expect(isDialogVisible).toBeTruthy();
  });

  test("TC53: Verify the manager view", async ({}) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC53.json");
    const TC53data = data.TC53;
    const employees = await teamPage.getEmployees();

    const expectedEmployees =
      process.env.REP_MAN_ID !== "EMP-00519" ? TC53data.employeesInQE : TC53data.employeesInStaging;

    // Normalize function to trim and collapse multiple spaces
    const normalize = (name) => name.replace(/\s+/g, " ").trim();

    const normalizedActual = employees.map(normalize).sort();
    const normalizedExpected = expectedEmployees.map(normalize).sort();

    expect(normalizedActual).toEqual(normalizedExpected);
  });

  test("TC91: Employee Status filter shows correct results", async () => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC91.json");
    const TC91data = data.TC91;
    const employeeStatuses = ["Active", "Inactive", "Suspended", "Left"];
    for (const empStatus of employeeStatuses) {
      console.warn(`Verifying results for Employee Status: ${empStatus}`);
      await teamPage.checkEmployeeStatus(empStatus);
      const employeesWithStatus = TC91data.createdEmployees.filter((emp) => emp.status === empStatus);
      if (employeesWithStatus.length > 0) {
        for (const employee of employeesWithStatus) {
          const fullName = `${employee.first_name} ${employee.last_name}`;
          await expect(teamPage.employeeNameInTable(fullName)).toBeVisible();
        }
      } else {
        console.warn(`No employees found with status: ${empStatus}`);
      }
    }
  });

  test("TC92: Approval Status filter shows correct results", async ({}) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC92.json");
    const TC92data = data.TC92;
    await teamPage.viewNextWeek();
    await teamPage.checkApprovalStatus(TC92data.payloadApprovalStatus.approvalStatus);
    const status = await teamPage.getTimesheetStatus(emp3Name);
    if (TC92data.payloadApprovalStatus.approvalStatus === "Partially Rejected") {
      expect(status).toContain("Rejected");
    } else {
      expect(status).toBe(TC92data.payloadApprovalStatus.approvalStatus);
    }
  });

  test("TC93: Project Filter shows employee under project", async ({}) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC93.json");
    const TC93data = data.TC93;
    await teamPage.checkProjectStatus(TC93data.payloadCreateProject.project_name);
    for (const employee of TC93data.projectSharedWithEmps) {
      await expect(teamPage.employeeNameInTable(employee)).toBeVisible();
    }
  });

  test("TC94: User group Filter shows correct results", async ({}) => {
    allure.story("Team");
    const data = await readJSONFile("../data/json-files/TC94.json");
    const TC94data = data.TC94;
    await teamPage.checkUserGroup(TC94data.payloadCreateUserGroup.__newname);
    await expect(teamPage.employeeNameInTable(TC94data.employeeName)).toBeVisible();
  });
});
