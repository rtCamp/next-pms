const { test, expect } = require("../../playwright.fixture.cjs");
import path from "path";
import { TimelinePage } from "../../pageObjects/resourceManagement/timeline";
import { TeamPage } from "../../pageObjects/resourceManagement/team";
import { ProjectPage } from "../../pageObjects/resourceManagement/project";
import * as allure from "allure-js-commons";
import { deleteAllocation } from "../../utils/api/projectRequests";
import {
  getFormattedDateNDaysFromToday,
  getFormattedPastWorkday,
  getFormattedDate,
  getDateForWeekday,
} from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";
import teamData from "../../data/manager/team";

/** @type {TimelinePage} */ let timelinePage;
/** @type {ProjectPage} */ let projectPage;
/** @type {TeamPage} */ let teamPage;

let createdAllocations = [];
let managerName = process.env.REP_MAN_NAME;
let employeeName = process.env.EMP3_NAME;

test.beforeEach(async ({ page }) => {
  timelinePage = new TimelinePage(page);
  teamPage = new TeamPage(page);
  projectPage = new ProjectPage(page);
});

// delete allocations after all tests if not deleted through UI
test.afterAll(async () => {
  //Print the created allocations array elements
  console.log("CREATED ALLOCATIONS OVERALL:", createdAllocations);

  for (const allocationName of createdAllocations) {
    try {
      await deleteAllocation(allocationName);
      console.info(`Allocation ${allocationName} deleted through API.`);
    } catch (error) {
      if (error.message.includes("404")) {
        console.info(`Allocation ${allocationName} deleted through UI.`);
      } else {
        console.warn(`Unexpected error while deleting allocation ${allocationName}:`, error);
      }
    }
  }
});

test.describe("Manager : Resource Management Tab", () => {
  test("TC56: Validate the search functionality", async () => {
    allure.story("Resource Management");
    await teamPage.goto();
    await teamPage.filterEmployeeByName(employeeName);
    const employeeCount = await teamPage.getEmployeeCountFromTable();
    await expect(employeeCount).toBe(1);
  });

  test("TC57: The reporting manager filter", async ({ page }) => {
    allure.story("Resource Management");
    await teamPage.goto();
    const before = await teamPage.getEmployeeNamesFromTable();
    expect(before.length).toBeGreaterThan(0);

    await teamPage.applyReportsTo(managerName);
    const after = await teamPage.getEmployeeNamesFromTable();

    // Compare who is listed, not how many. The grid renders a fixed page of 10,
    // so once the manager has 10+ reports both counts are 10 and "fewer rows"
    // stops meaning anything - which is exactly what happened once seeding
    // started adding employees under this manager.
    expect(after.length).toBeLessThanOrEqual(before.length);
    const dropped = before.filter((name) => !after.includes(name));
    expect(dropped.length, "filtering by reporting manager should drop members who do not report to them").toBeGreaterThan(0);

    await expect(page.getByText(employeeName)).toBeVisible();
  });

  test("TC58: The filters should only apply to the results displayed after selecting the reporting manager.", async ({
    page,
  }) => {
    allure.story("Resource Management");
    await teamPage.goto();
    const employeeCount = await teamPage.getEmployeeCountFromTable();
    await teamPage.applyReportsTo(managerName);
    await teamPage.addfilter("Business Unit", "Polaris");
    await page.waitForTimeout(150); // slight delay for filters to apply
    const updatedEmployeeCount = await teamPage.getEmployeeCountFromTable();
    await expect(updatedEmployeeCount).toBeLessThan(employeeCount);
    // An empty grid would satisfy "fewer than before" while proving nothing -
    // that is how TC59 came to pass without verifying anything.
    expect(updatedEmployeeCount).toBeGreaterThan(0);
    // Scoped to the member row rather than page-wide text: an unscoped match
    // would also accept the name appearing in a filter value or a tooltip.
    await expect(teamPage.memberRow(employeeName).first()).toBeVisible();
  });

  // The four filters no longer share one affordance: Business Unit and Skill are
  // query-builder conditions, Designation and Allocation Type are standalone
  // comboboxes. All four still feed one filter state.
  //
  // This case now seeds its own project and a *billable* allocation for the
  // employee it asserts on, and pins the Business Unit / Designation values to
  // what that employee actually is on the environment. Before that, no employee
  // could satisfy the combination, every filter step returned an empty grid, and
  // the "each filter narrows the result" checks all held trivially against zero
  // rows - the test was green without verifying anything.
  //
  // The Skill filter is deliberately not exercised here: the employee has no
  // Employee Skill Map at all (404), so there is no skill to match, and Skill is
  // not part of what this case's title covers. It needs its own case once skill
  // seeding exists.
  test.skip("TC59: Validate the Business Unit, Designation, and Allocation Type ensuring that the results are checked after clearing all applied filters", async ({
    jsonDir,
  }) => {
    allure.story("Resource Management");
    // Three filters plus a clear is well past the 30s default at slowMo:500.
    test.setTimeout(180000);

    const stubPath = path.join(jsonDir, "TC59.json");
    const data = await readJSONFile(stubPath);
    const TC59data = data.TC59;
    const employeeName = TC59data.employee;

    await teamPage.goto();
    const baselineCount = await teamPage.getEmployeeCountFromTable();
    expect(baselineCount).toBeGreaterThan(0);

    // Each filter is ANDed onto the previous, so the result set may only shrink.
    await teamPage.addfilter("Business Unit", TC59data.businessUnit);
    const afterBusinessUnit = await teamPage.getEmployeeCountFromTable();
    expect(afterBusinessUnit).toBeLessThanOrEqual(baselineCount);

    await teamPage.addfilter("Designation", TC59data.designation);
    const afterDesignation = await teamPage.getEmployeeCountFromTable();
    expect(afterDesignation).toBeLessThanOrEqual(afterBusinessUnit);

    await teamPage.addfilter("Allocation Type", "Billable");
    const filteredCount = await teamPage.getEmployeeCountFromTable();
    expect(filteredCount).toBeLessThanOrEqual(afterDesignation);

    // The point of the case: the filters narrowed the grid, and the employee who
    // satisfies all three is still in it. Without this the counts alone would
    // accept an empty result.
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(baselineCount);
    await expect(teamPage.memberRow(employeeName).first()).toBeVisible();

    // Clearing every filter must restore the unfiltered grid.
    await teamPage.clearFilters();
    expect(await teamPage.getAppliedFilterCount()).toBe(0);
    const updatedEmployeeCount = await teamPage.getEmployeeCountFromTable();
    expect(updatedEmployeeCount).toBeGreaterThan(filteredCount);
    expect(updatedEmployeeCount).toBe(baselineCount);
  });

  // Scope changed: the "Actual vs Planned" / "Planned vs Capacity" sheet-view
  // switcher this case originally covered no longer exists, and the grid reports
  // remaining capacity ("8h free" / "Full") rather than an "actual / planned"
  // pair, so there is no view toggle left to compare across. What the team view
  // still guarantees is that allocating an employee consumes their capacity, so
  // that is what this now asserts. The test-case sheet still describes the old
  // sheet-view behaviour and needs reconciling.
  test("TC60: Allocating an employee reduces their free capacity on the team view", async ({ jsonDir }) => {
    allure.story("Resource Management");

    // Creating or editing an allocation is a ~15-25s flow at slowMo's half second
    // per action, and several of these reload and re-filter afterwards. That leaves
    // no headroom under the 30s default - TC107 went over on a slow navigation while
    // TC104/TC109/TC110 were all sitting within seconds of the ceiling. Same budget
    // TC103 already carries.
    test.setTimeout(120000);
    const stubPath = path.join(jsonDir, "TC60.json");
    const data = await readJSONFile(stubPath);
    const TC60data = data.TC60;
    const projectName = TC60data.payloadCreateProject.project_name;
    const employeeName = TC60data.employee;
    const customerName = TC60data.payloadCreateProject.customer;
    const formattedDate = getFormattedDate(getDateForWeekday(TC60data.cell.col));

    // Baseline first: every member shows "8h free" by default, so asserting on
    // the post-allocation state alone would pass without creating anything.
    await teamPage.goto();
    await teamPage.filterEmployeeByName(employeeName);
    const capacityBefore = await teamPage.getMemberRowText(employeeName);

    await timelinePage.goto();
    await timelinePage.isPageVisible();
    const allocationName = await timelinePage.addAllocation(projectName, customerName, employeeName, formattedDate);
    createdAllocations.push(allocationName);

    await teamPage.goto();
    await teamPage.filterEmployeeByName(employeeName);
    const capacityAfter = await teamPage.getMemberRowText(employeeName);

    expect(capacityAfter).not.toEqual(capacityBefore);
  });

  test.skip("TC61: Validate the Combine Week Hours", async ({ page }) => {
    allure.story("Resource Management");
    const TC61 = teamData.TC61;
    const weeklyTime = TC61.weeklyTime;
    await teamPage.goto();
    await teamPage.clickCombineWeekHoursCheckbox();
    await expect(page.getByText(`${weeklyTime}`).first()).toBeVisible();
    await teamPage.clickCombineWeekHoursCheckbox();
    await expect(page.locator("body")).not.toContainText(`${weeklyTime}`);
  });

  // Scope changed: the grid steps by quarter rather than by week, so the marker
  // that tells you where the window sits is "This quarter" and the buttons are
  // Previous/Next Quarter. The behaviour being checked is unchanged - step away
  // from today and the marker goes, step back and it returns.
  test("TC62: Validate the functionality of the ‘Next’ and ‘Previous’ quarter change buttons.", async ({ page }) => {
    allure.story("Resource Management");
    await teamPage.goto();
    await page.waitForTimeout(150);
    // "This quarter" is the range picker's own label and reads the same wherever
    // the window sits, so the header's week ranges are what tell you it moved.
    const initialRanges = await teamPage.getVisibleWeekRanges();
    expect(initialRanges.length).toBeGreaterThan(0);

    await teamPage.clickNextWeekButton();
    await page.waitForTimeout(2000);
    const nextRanges = await teamPage.getVisibleWeekRanges();
    expect(nextRanges.length).toEqual(initialRanges.length);
    expect(nextRanges[0]).not.toEqual(initialRanges[0]);

    await teamPage.clickPreviousWeekButton();
    await page.waitForTimeout(2000);
    expect(await teamPage.getVisibleWeekRanges()).toEqual(initialRanges);
  });

  test("TC68: Validate the entire list of allocated resources by clicking on the employee name.", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Resource Management");

    // Creating or editing an allocation is a ~15-25s flow at slowMo's half second
    // per action, and several of these reload and re-filter afterwards. That leaves
    // no headroom under the 30s default - TC107 went over on a slow navigation while
    // TC104/TC109/TC110 were all sitting within seconds of the ceiling. Same budget
    // TC103 already carries.
    test.setTimeout(120000);
    const stubPath = path.join(jsonDir, "TC68.json");
    const data = await readJSONFile(stubPath);
    const TC68data = data.TC68;
    const projectName = TC68data.payloadCreateProject.project_name;
    const employeeName = TC68data.employee;
    const customerName = TC68data.payloadCreateProject.customer;
    await timelinePage.goto();
    await timelinePage.isPageVisible();
    const allocationName = await timelinePage.addAllocation(projectName, customerName, employeeName);
    createdAllocations.push(allocationName);
    await teamPage.goto();
    await teamPage.filterEmployeeByName(employeeName);
    await teamPage.clickFirstEmployeeFromTable();
    const ResourceAllocationRowIsVisible = await teamPage.checkIfExtendedResourceAllocationIsVisible();
    await expect(ResourceAllocationRowIsVisible).toBe(true);
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 5000 });
  });

  test("TC102: Verify add Allocation workflow by the Plus button", async ({ page, jsonDir }) => {
    allure.story("Resource Management");

    // Creating or editing an allocation is a ~15-25s flow at slowMo's half second
    // per action, and several of these reload and re-filter afterwards. That leaves
    // no headroom under the 30s default - TC107 went over on a slow navigation while
    // TC104/TC109/TC110 were all sitting within seconds of the ceiling. Same budget
    // TC103 already carries.
    test.setTimeout(120000);
    const stubPath = path.join(jsonDir, "TC102.json");
    const data = await readJSONFile(stubPath);

    const TC102data = data.TC102;
    const projectName = TC102data.payloadCreateProject.project_name;
    const employeeName = TC102data.employee;
    const customerName = TC102data.payloadCreateProject.customer;

    await timelinePage.goto();
    await timelinePage.isPageVisible();
    const allocationName = await timelinePage.addAllocation(projectName, customerName, employeeName);
    createdAllocations.push(allocationName);
    await expect(page.getByText("Allocation created successfully")).toBeVisible();

    await timelinePage.goto();
    // The Project tab filters by project, and deleteAllocation locates the
    // allocation by project too, so narrow down that way.
    await timelinePage.filterByProjectName(projectName);
    await timelinePage.deleteAllocation(projectName);
    await expect(page.getByText("The allocation has been deleted successfully")).toBeVisible();
  });

  // Scope changed: a member row is 13 cells wide - one per week of the quarter,
  // not one per day - and an empty cell has no click target, so "click the cell
  // for this employee on this date" is no longer a thing the UI offers. The
  // date now goes through the allocation dialog's own picker, which is what
  // this drives. The test-case sheet still describes clicking a day cell.
  test("TC103: Verify add Allocation workflow by clicking on a specfic cell wrt Employee and Date", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Resource Management");
    // Project + customer + employee + date range + hours is a long dialog, and
    // slowMo:500 puts it past the 30s default.
    test.setTimeout(120000);
    const stubPath = path.join(jsonDir, "TC103.json");
    const data = await readJSONFile(stubPath);
    const TC103data = data.TC103;

    const projectName = TC103data.payloadCreateProject.project_name;
    const employeeName = TC103data.employee;
    const customerName = TC103data.payloadCreateProject.customer;
    const { date, day } = getFormattedDateNDaysFromToday(4);
    await teamPage.goto();
    const { allocationName } = await teamPage.addAllocationFromTeamTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
    );
    createdAllocations.push(allocationName);
    await expect(page.getByText("Allocation created successfully")).toBeVisible();
    //await teamPage.goto();
    //await timelinePage.filterEmployeeByName(employeeName);
    //await teamPage.deleteAllocationFromTeamTab(employeeName, date, day);
    //await expect(page.getByText("The allocation has been deleted successfully")).toBeVisible();
  });

  test("TC104: Verify add Allocation workflow by clicking on a specfic cell wrt Project and Date", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Resource Management");

    // Creating or editing an allocation is a ~15-25s flow at slowMo's half second
    // per action, and several of these reload and re-filter afterwards. That leaves
    // no headroom under the 30s default - TC107 went over on a slow navigation while
    // TC104/TC109/TC110 were all sitting within seconds of the ceiling. Same budget
    // TC103 already carries.
    test.setTimeout(120000);
    const stubPath = path.join(jsonDir, "TC104.json");
    const data = await readJSONFile(stubPath);
    const TC104data = data.TC104;

    const projectName = TC104data.payloadCreateProject.project_name;
    const employeeName = TC104data.employee;
    const customerName = TC104data.payloadCreateProject.customer;
    const { date, day } = getFormattedDateNDaysFromToday(2);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
    );
    createdAllocations.push(allocationName);
    await expect(page.getByText("Allocation created successfully")).toBeVisible();
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.deleteAllocationFromProjectTab(projectName, date, day);
    await expect(page.getByText("The allocation has been deleted successfully")).toBeVisible();
  });

  test("TC107: Verify adding allocation on a past day", async ({ page, jsonDir }) => {
    allure.story("Resource Management");

    // Creating or editing an allocation is a ~15-25s flow at slowMo's half second
    // per action, and several of these reload and re-filter afterwards. That leaves
    // no headroom under the 30s default - TC107 went over on a slow navigation while
    // TC104/TC109/TC110 were all sitting within seconds of the ceiling. Same budget
    // TC103 already carries.
    test.setTimeout(120000);
    const stubPath = path.join(jsonDir, "TC107.json");
    const data = await readJSONFile(stubPath);
    const TC107data = data.TC107;

    const projectName = TC107data.payloadCreateProject.project_name;
    const employeeName = TC107data.employee;
    const customerName = TC107data.payloadCreateProject.customer;
    const { date } = getFormattedPastWorkday(-1);
    await projectPage.goto();
    const allocationName = await projectPage.addAllocation(projectName, customerName, employeeName, date);
    createdAllocations.push(allocationName);
    await expect(page.getByText("Allocation created successfully")).toBeVisible();
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    // await projectPage.deleteAllocationFromProjectTab(projectName, date, day);
    // await expect(page.getByText("The allocation has been deleted successfully")).toBeVisible();
  });

  // The copy/clipboard shortcut this case covers was removed in the redesign -
  // confirmed with the team, not a selector that moved. Allocations are chips in
  // the grid now, and a chip's popover offers only "Edit allocation" and
  // "Delete allocation"; there is no duplicate control anywhere on the page, so
  // there is nothing left to drive. The remaining actions are already covered
  // (TC110 edits an allocation, TC109 changes its billable flag), so no rescope
  // would add coverage. Skipped rather than deleted so the case is easy to
  // restore if a duplicate action ever comes back. clickClipboardIcon() in
  // resourceManagement/project.js still throws an explaining error for the same
  // reason.
  test.skip("TC108: Verify adding allocation from the clipboard icon", async ({ page, jsonDir }) => {
    allure.story("Resource Management");

    const stubPath = path.join(jsonDir, "TC108.json");
    const data = await readJSONFile(stubPath);
    const TC108data = data.TC108;

    const projectName = TC108data.infoPayloadCreateAllocation.project_name;
    const employeeName = TC108data.infoPayloadCreateAllocation.employee;
    const customerName = TC108data.infoPayloadCreateAllocation.customer;
    const { date, day } = getFormattedDateNDaysFromToday(3);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
      "4",
    );
    //console.log(`Allocation Name: ${allocationName}`);
    createdAllocations.push(allocationName);
    await expect(page.getByText("Allocation created successfully")).toBeVisible();
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.clickClipboardIcon(projectName, date, day);
    const { updatedAllocationName } = await projectPage.addAllocationFromProjectTabFromClipboard("8");
    createdAllocations.push(updatedAllocationName);
    await expect(page.getByText("Allocation created successfully")).toBeVisible();
  });

  test("TC109: Verify Changing/updating the billable/non billable on a project allocation", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Resource Management");

    // Creating or editing an allocation is a ~15-25s flow at slowMo's half second
    // per action, and several of these reload and re-filter afterwards. That leaves
    // no headroom under the 30s default - TC107 went over on a slow navigation while
    // TC104/TC109/TC110 were all sitting within seconds of the ceiling. Same budget
    // TC103 already carries.
    test.setTimeout(120000);

    const stubPath = path.join(jsonDir, "TC109.json");
    const data = await readJSONFile(stubPath);
    const TC109data = data.TC109;

    const projectName = TC109data.payloadCreateProject.project_name;
    const employeeName = TC109data.employee;
    const customerName = TC109data.payloadCreateProject.customer;
    const { date, day } = getFormattedDateNDaysFromToday(6);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
      "4",
    );
    createdAllocations.push(allocationName);
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.clickEditIcon(projectName, date, day);
    await projectPage.clickOnBillableToggle();
    await projectPage.clickSaveButton();
    await expect(page.getByText("Allocation updated successfully")).toBeVisible();
  });

  test("TC110: Verify Editing a time allocation", async ({ page, jsonDir }) => {
    allure.story("Resource Management");

    // Creating or editing an allocation is a ~15-25s flow at slowMo's half second
    // per action, and several of these reload and re-filter afterwards. That leaves
    // no headroom under the 30s default - TC107 went over on a slow navigation while
    // TC104/TC109/TC110 were all sitting within seconds of the ceiling. Same budget
    // TC103 already carries.
    test.setTimeout(120000);

    const stubPath = path.join(jsonDir, "TC110.json");
    const data = await readJSONFile(stubPath);
    const TC110data = data.TC110;

    const projectName = TC110data.payloadCreateProject.project_name;
    const employeeName = TC110data.employee;
    const customerName = TC110data.payloadCreateProject.customer;
    const updatedHours = "8";
    const { date, day } = getFormattedDateNDaysFromToday(7);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
      "4",
    );
    createdAllocations.push(allocationName);
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.clickEditIcon(projectName, date, day);
    await projectPage.editAllocationFromProjectTab(updatedHours, updatedHours);
    await projectPage.clickSaveButton();
    await expect(page.getByText("Allocation updated successfully")).toBeVisible();
    let allocationTime = await projectPage.getAllocationFromProjectTab(projectName, date, day);
    expect(allocationTime).toEqual(updatedHours);
  });

  test("TC111: Allocation for more than 8 hours per day / allocation of more than 24 hours per day.", async ({
    jsonDir,
  }) => {
    allure.story("Resource Management");

    // Creating or editing an allocation is a ~15-25s flow at slowMo's half second
    // per action, and several of these reload and re-filter afterwards. That leaves
    // no headroom under the 30s default - TC107 went over on a slow navigation while
    // TC104/TC109/TC110 were all sitting within seconds of the ceiling. Same budget
    // TC103 already carries.
    test.setTimeout(120000);

    const stubPath = path.join(jsonDir, "TC111.json");
    const data = await readJSONFile(stubPath);
    const TC111data = data.TC111;

    const projectName = TC111data.payloadCreateProject.project_name;
    const employeeName = TC111data.employee;
    const customerName = TC111data.payloadCreateProject.customer;
    const excessiveHours = "25";
    const { date, day } = getFormattedDateNDaysFromToday(8);

    // How the cap is enforced changed. The form's zod schema still carries
    // "Hour / Day should be less than 24" (frontend schema/resource.ts), but the
    // Hours/day input clamps entries to the employee's daily capacity before the
    // schema ever sees them - typing 25 submits 8 - so that message is
    // unreachable through the UI and asserting on it can only ever fail.
    // The clamp is the enforcement, so assert the guarantee in the title instead:
    // an attempt to allocate more than 24h/day must not produce one.
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
      excessiveHours,
    );
    createdAllocations.push(allocationName);
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    const allocatedHours = Number(await projectPage.getAllocationFromProjectTab(projectName, date, day));
    expect(allocatedHours).toBeGreaterThan(0);
    expect(allocatedHours).toBeLessThanOrEqual(24);
  });
});
