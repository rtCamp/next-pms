const path = require("path");
const { test, expect } = require("../../playwright.fixture.cjs");
import { TeamPage } from "../../pageObjects/teamPage";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import { getDateForWeekday, getShortFormattedDate } from "../../utils/dateUtils";
import * as allure from "allure-js-commons";
import { readJSONFile } from "../../utils/fileUtils";
import { randomApprovalStatus } from "../../helpers/teamTabHelper";

/** @type {TeamPage} */ let teamPage;
/** @type {TimesheetPage} */ let timesheetPage;

// Load env variables
const empName = process.env.EMP_NAME;
const manName = process.env.REP_MAN_NAME;
const emp3Name = process.env.EMP3_NAME;

test.describe("Manager: Team Tab", () => {
  test.beforeEach(async ({ page }) => {
    teamPage = new TeamPage(page);
    timesheetPage = new TimesheetPage(page);
    await teamPage.goto();
  });

  test("TC38: Validate the search functionality", async () => {
    allure.story("Team");
    await teamPage.searchEmployee(empName);
    const filteredEmployees = await teamPage.getEmployees();
    expect(filteredEmployees.length).toBe(1);
    expect(filteredEmployees[0]).toBe(empName);
  });

  test("TC39: The reporting manager filter", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC39.json");
    const data = await readJSONFile(stubPath);
    const TC39data = data.TC39;
    await teamPage.applyReportsTo(manName);
    const employees = await teamPage.getEmployees();
    for (const expectedEmployee of TC39data.employees) {
      expect(employees).toContain(expectedEmployee);
    }
  });

  test("TC42: Validate Next/Previous week change buttons", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC42.json");
    const data = await readJSONFile(stubPath);
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

  test("TC43: Timesheet dropdown section is working", async () => {
    allure.story("Team");

    await teamPage.toggleEmployeeTimesheet(empName);
    const isVisible = await teamPage.isEmployeeTimesheetVisible(empName);
    expect(isVisible).toBeTruthy();
  });

  test("TC44: Timesheets for employees for all weeks", async () => {
    allure.story("Team");
    await teamPage.navigateToEmpTimesheet(empName);
    const selectedEmployee = await timesheetPage.getSelectedEmployee();
    expect(selectedEmployee).toContain(empName);
  });

  test("TC45: Change selected employee and verify timesheets update", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC45.json");
    const data = await readJSONFile(stubPath);
    const TC45data = data.TC45;

    await teamPage.navigateToEmpTimesheet(empName);
    await timesheetPage.selectEmployee(TC45data.employee);
    const selectedEmployee = await timesheetPage.getSelectedEmployee();
    expect(selectedEmployee).toContain(TC45data.employee);
  });

  test("TC47: Modify or delete employee time entries", async ({ page, jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC47.json");

    const data = await readJSONFile(stubPath);
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
    await teamPage.toastNotification(TC47data.taskInfo.toastNotification).waitFor({ state: "visible" });
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

  test("TC50: Open task details popup", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC50.json");
    const data = await readJSONFile(stubPath);
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

  test("TC53: Verify the manager view", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC53.json");
    const data = await readJSONFile(stubPath);
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

  test("TC91: Employee Status filter shows correct results", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC91.json");
    const data = await readJSONFile(stubPath);
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

  test("TC93: Project Filter shows employee under project", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC93.json");
    const data = await readJSONFile(stubPath);
    const TC93data = data.TC93;
    await teamPage.checkProjectStatus(TC93data.payloadCreateProject.project_name);
    for (const employee of TC93data.projectSharedWithEmps) {
      await expect(teamPage.employeeNameInTable(employee)).toBeVisible();
    }
  });

  test("TC94: User group Filter shows correct results", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC94.json");
    const data = await readJSONFile(stubPath);
    const TC94data = data.TC94;
    await teamPage.checkUserGroup(TC94data.payloadCreateUserGroup.__newname);
    await expect(teamPage.employeeNameInTable(TC94data.employeeName)).toBeVisible();
  });

  test("TC95: Verify multiple filters at a time", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC95.json");
    const data = await readJSONFile(stubPath);
    const TC95data = data.TC95;

    //Verify that the expected employee is displayed when project and user group filters are applied.
    await teamPage.checkProjectStatus(TC95data.payloadCreateProject.project_name);
    await teamPage.checkUserGroup(TC95data.payloadCreateUserGroup.__newname);
    const employees = await teamPage.getEmployees();
    expect(employees).toContain(TC95data.employee);
  });

  test("TC49: Reject timesheet for employee", async ({ page, jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC49.json");
    const data = await readJSONFile(stubPath);
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

  test("TC112: Verify no results when search does not return any results", async ({ page }) => {
    allure.story("Team");

    await teamPage.searchEmployee("Negative Test");
    await expect(page.getByText("No results")).toBeVisible();
  });

  test("TC114: Save changes for team tab and validate if the same changes are displayed are not.", async ({ page }) => {
    allure.story("Team");
    test.setTimeout(60000);
    await teamPage.saveNewView(manName);
    await expect(page.getByText("View Updated", { exact: true })).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/method/next_pms.timesheet.api.team.get_compact_view_data") && resp.status() === 200
      ),
      teamPage.goto(),
    ]);
    await expect(page.url()).toContain("reports-to=%22EMP-");
  });
});

test.describe("Manager: Team Tab2", () => {
  //API call in beforeALL to make sure the emp has correct approval status
  test.beforeAll(async ({ jsonDir }) => {
    await randomApprovalStatus(["TC92"], jsonDir);
  });

  test.beforeEach(async ({ page }) => {
    teamPage = new TeamPage(page);
    timesheetPage = new TimesheetPage(page);
    await teamPage.goto();
  });

  test("TC92: Approval Status filter shows correct results", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC92.json");
    const data = await readJSONFile(stubPath);
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
});
