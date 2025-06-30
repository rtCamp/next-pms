import path from "path";
import { test, expect } from "../../fixtures/teamFixtures";
import { TeamPage } from "../../pageObjects/teamPage";
import { TimesheetPage } from "../../pageObjects/timesheetPage";
import { getDateForWeekday, getShortFormattedDate } from "../../utils/dateUtils";
import * as allure from "allure-js-commons";
//Add type hints to help VS Code recognize TaskPage
/** @type {TeamPage} */

let teamPage;
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
test.use({ testCaseIDs: ["TC91"] });
test.describe.only("Manager: Team Tab", () => {
  test.beforeEach(async ({ page }) => {
    teamPage = new TeamPage(page);
    timesheetPage = new TimesheetPage(page);
    await teamPage.goto();
  });

  test.only("TC91: Employee Status filter shows correct results", async ({ teamData }) => {
    allure.story("Team");

    const TC91data = teamData.TC91; // ✅ Pull fresh data from the fixture

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
});
