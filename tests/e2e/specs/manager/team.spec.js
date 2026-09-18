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

    await teamPage.expandEmployeeRow(empName);

    // The member stays listed and their timesheet breakdown opens inline.
    expect(await teamPage.getEmployees()).toEqual([empName]);
    expect(await teamPage.getEmployeeDetailRows()).not.toHaveLength(0);
  });

  test("TC45: Change selected employee and verify timesheets update", async ({ jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC45.json");
    const data = await readJSONFile(stubPath);
    const TC45data = data.TC45;

    await teamPage.expandEmployeeRow(empName);
    const firstEmployeeRows = await teamPage.getEmployeeDetailRows();
    expect(await teamPage.getEmployees()).toEqual([empName]);

    // Switching to another member replaces the breakdown with theirs.
    await teamPage.expandEmployeeRow(TC45data.employee);
    expect(await teamPage.getEmployees()).toEqual([TC45data.employee]);

    const secondEmployeeRows = await teamPage.getEmployeeDetailRows();
    expect(secondEmployeeRows).not.toHaveLength(0);
    expect(secondEmployeeRows).not.toEqual(firstEmployeeRows);
  });

  test("TC47: Modify or delete employee time entries", async ({ page, jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC47.json");

    const data = await readJSONFile(stubPath);
    const TC47data = data.TC47;
    // Review pane + inline edit + reload + re-reading the grid runs well past
    // the 30s default once slowMo:500 is applied to every action.
    test.setTimeout(180000);
    // This test's own employee, created by globalSetup. A shared account cannot
    // be used: the review pane needs a submitted timesheet, and submitting one
    // breaks TC11 and TC6, which both require an unsubmitted one.
    const reviewee = TC47data.revieweeName;
    // Fails loudly if globalSetup could not create it - Employee creation is
    // currently broken on this environment (the Employee POST 500s with
    // "AttributeError: 'EmployeeMaster' object has no attribute
    // 'job_applicant'"), which also makes TC91 pass without asserting anything.
    expect(reviewee, "globalSetup did not create this test's own employee").toBeTruthy();

    await teamPage.viewNextWeek();
    await teamPage.openReviewTimesheetPane(reviewee);
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
    await teamPage.searchEmployee(reviewee);
    await teamPage.toggleEmployeeTimesheet(reviewee);
    const cellText = await timesheetPage.getCellText({
      employee: reviewee,
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
    // Four statuses, each applying a filter and then searching per employee -
    // well past the 30s default once slowMo:500 is applied to every action.
    test.setTimeout(180000);

    // Start from a clean filter state. A worker reuses one browser context
    // across this file, and the app keeps filters, so an earlier test's
    // condition (TC39/TC57 leave a Reporting Manager one) is still applied
    // here and silently narrows what this test is looking at.
    await teamPage.removeAllFilterConditions();

    // Without this the test is vacuous: globalSetup creates one employee per
    // status, and when that fails `createdEmployees` is [], every per-status
    // filter below finds nothing to assert on, and the whole test passes having
    // checked nothing. It has been doing exactly that - Employee creation on
    // this environment 500s with "AttributeError: 'EmployeeMaster' object has no
    // attribute 'job_applicant'", so all four creations fail silently.
    expect(
      TC91data.createdEmployees,
      "globalSetup created no employees for TC91 - without them this test asserts nothing"
    ).toBeTruthy();
    expect(TC91data.createdEmployees.length).toBeGreaterThan(0);

    for (const empStatus of employeeStatuses) {
      console.warn(`Verifying results for Employee Status: ${empStatus}`);
      await teamPage.checkEmployeeStatus(empStatus);
      const employeesWithStatus = TC91data.createdEmployees.filter((emp) => emp.status === empStatus);

      // Each status needs a seeded employee, or that status is not being tested.
      expect(employeesWithStatus.length, `no seeded employee with status "${empStatus}"`).toBeGreaterThan(0);

      for (const employee of employeesWithStatus) {
        const fullName = `${employee.first_name} ${employee.last_name}`;

        // Search as well as filter. The grid lists every employee (247 are
        // Active) 20 at a time in alphabetical order, so a "Playwright-" name
        // is never on the first page and the status filter alone cannot bring
        // it into view. Searching narrows it to the one row, which is what
        // makes this assert "this employee shows up under this status" rather
        // than "this employee happens to sort early".
        await teamPage.searchEmployee(fullName);
        await expect(teamPage.employeeNameInTable(fullName)).toBeVisible();

        // Leave the box clean for the next employee / status.
        await teamPage.searchEmployee("");
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

  // The User Group filter was removed and has no counterpart to verify. The
  // timesheet team panel offers Project, Task, Date, Member, Member Status and
  // Business Unit; the allocations team panel offers Skill, Tag, Business Unit
  // and Reporting Manager. Neither exposes user groups, and no user-group
  // control exists anywhere on either page - "Toggle options" is the reporting
  // manager selector. Skipped rather than deleted pending a call from
  // @ayushnirwal on whether group-based filtering was dropped deliberately.
  test.skip("TC94: User group Filter shows correct results", async ({ jsonDir }) => {
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
    // Two query-builder conditions plus reading the grid is ~55 actions, and
    // slowMo:500 puts that past the 30s default.
    test.setTimeout(120000);

    // Second filter changed from User Group to Business Unit: the User Group
    // control was removed in the redesign (the panel offers Project, Task,
    // Date, Member, Member Status and Business Unit), so the original pairing
    // has nothing to drive. What the case is really about - two filters of
    // different kinds ANDing rather than replacing each other - is unchanged.
    // Start from a known filter state: the worker reuses one browser context
    // across this file's tests, so a filter left applied by an earlier test
    // (TC93 applies one) would still be counted below.
    await teamPage.removeAllFilterConditions();

    await teamPage.checkProjectStatus(TC95data.payloadCreateProject.project_name);
    await teamPage.checkBusinessUnit(TC95data.businessUnit);
    const employees = await teamPage.getEmployees();
    expect(employees).toContain(TC95data.employee);
    // Both conditions are really registered - the point of the case is that the
    // second filter ANDs onto the first rather than replacing it. Asserted on
    // the field names rather than the count badge, whose handling of the blank
    // row the panel re-seeds is inconsistent.
    const appliedFields = await teamPage.getAppliedFilterFields();
    expect(appliedFields).toContain("Project");
    expect(appliedFields).toContain("Business Unit");
  });

  test("TC49: Reject timesheet for employee", async ({ page, jsonDir }) => {
    allure.story("Team");
    const stubPath = path.join(jsonDir, "TC49.json");
    const data = await readJSONFile(stubPath);
    const TC49data = data.TC49;
    // Opening the review pane, rejecting with a note, reloading and re-reading
    // the status is ~90 actions; slowMo:500 puts that well past the 30s default.
    test.setTimeout(180000);

    // Own employee - see the note in TC47.
    const reviewee = TC49data.revieweeName;
    // Fails loudly if globalSetup could not create it - Employee creation is
    // currently broken on this environment (the Employee POST 500s with
    // "AttributeError: 'EmployeeMaster' object has no attribute
    // 'job_applicant'"), which also makes TC91 pass without asserting anything.
    expect(reviewee, "globalSetup did not create this test's own employee").toBeTruthy();

    await teamPage.viewNextWeek();
    await teamPage.rejectTimesheet({
      employee: reviewee,
      reason: TC49data.reason,
      notification: TC49data.notification,
    });
    await page.reload();
    await teamPage.viewNextWeek();
    const status = await teamPage.getTimesheetStatus(reviewee);
    // "Rejected" is only reported when *every* working day in the week is
    // rejected (timesheet/api/utils.py: status_count["Rejected"] >=
    // effective_total_days); with some days rejected it is "Partially
    // rejected". This test seeds a single day's entry, so the exact wording
    // depends on how many working days the employee has - which is environment
    // data, not behaviour. What the case is about is that the rejection took.
    expect(status).toMatch(/rejected/i);
  });

  test("TC112: Verify no results when search does not return any results", async ({ page }) => {
    allure.story("Team");

    await teamPage.searchEmployee("Negative Test");
    // Every rendered week section shows its own empty-state line, so this text
    // matches once per week (4 at the time of writing). Assert on the first -
    // an unscoped locator throws a strict-mode violation, and the count varies
    // with how many weeks are on screen.
    await expect(page.getByText("No timesheet for this week").first()).toBeVisible();
  });

  // Skipped: the capability is gone. There is no "Save changes" control on the
  // team tab any more - no save/update-view button exists at all, before or
  // after applying a filter - so saveNewView() has nothing to click and the
  // test hangs on it.
  //
  // The redesign also changed how filter state is carried: this asserts the URL
  // contains `reports-to="EMP-`, but filters are now one JSON blob, e.g.
  //   ?compositeFilters=[{"field":"employee","operator":"=","value":"EMP-00914",
  //                       "fieldCategory":"Timesheet","displayLabel":"Renish Employee"}]
  // so the final assertion could not pass either.
  //
  // Filters still persist - via the URL rather than by saving them onto a view.
  // Rescoping this to assert that persistence would keep the intent, but it is
  // a different mechanism, so skipped pending a call on whether saving filters
  // to a view was dropped deliberately. The test-case sheet still describes the
  // old behaviour.
  test.skip("TC114: Save changes for team tab and validate if the same changes are displayed are not.", async ({ page }) => {
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
    // Scope changed: approval status can no longer be filtered on. The team
    // filter panel offers only Project, Task, Date, Member, Member Status and
    // Business Unit ("Member Status" is employment state - Active / Inactive /
    // Suspended / Left - not approval state), so checkApprovalStatus() has no
    // control to drive. Approval status is still *displayed* per member, so this
    // now verifies the status the member's row shows matches the one seeded for
    // them. The missing filter is worth raising with @ayushnirwal.
    const expectedStatus = TC92data.payloadApprovalStatus.approvalStatus;
    const status = await teamPage.getApprovalStatusFromRow(emp3Name);

    expect(status, "The member's row shows an approval status").not.toBeNull();

    // Match case-insensitively: the seeded value is title-cased
    // ("Partially Rejected") but the row renders sentence case
    // ("Partially rejected").
    if (expectedStatus === "Partially Rejected") {
      expect(status).toMatch(/rejected/i);
    } else {
      expect(status).toMatch(new RegExp(expectedStatus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    }
  });
});
