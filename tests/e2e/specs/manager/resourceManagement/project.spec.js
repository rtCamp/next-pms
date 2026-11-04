const { test, expect } = require("../../../playwright.fixture.cjs");
import path from "path";
import { ProjectPage } from "../../../pageObjects/resourceManagement/project";
import * as allure from "allure-js-commons";
import { readJSONFile } from "../../../utils/fileUtils";
/** @type {ProjectPage} */
let projectPage;
test.describe("Resource Management : Project Tab -> Filters", () => {
  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
    await projectPage.goto();
  });

  test("TC73: Validate the customer filter on RM project tab", async ({
    jsonDir,
  }) => {
    allure.story("Resource Management : Project Tab");

    // Load test data from JSON stub file
    const stubPath = path.join(jsonDir, "TC73.json");
    const data = await readJSONFile(stubPath);
    const TC73data = data.TC73;

    await projectPage.clearFilters(); // Clear any existing filters
    await projectPage.searchBar.fill(
      TC73data.payloadCreateProject.project_name,
    ); // Search for the project
    //Wait until the project name is displayed in the table
    await projectPage.waitForOnlyOneElement(projectPage.projectListItems);
    // Capture project list before applying the customer filter
    const projectListBeforeFilter = await projectPage.getProjectList();

    // Apply filter by customer name from test data
    await projectPage.applyFilters({
      customer: TC73data.payloadCreateAllocation2.customer,
    });

    // Capture project list after filter is applied
    const projectListAfterFilter = await projectPage.getProjectList();

    // Assert that the project list after applying the filter is different (filtered)
    expect(projectListAfterFilter).toEqual(projectListBeforeFilter);

    // Assert that the filtered project list contains the expected project name
    const projectNameAfterCustomerFilter =
      TC73data.payloadCreateProject.project_name;
    expect(projectListAfterFilter.projectNames).toEqual([
      projectNameAfterCustomerFilter,
    ]);
  });

  test("TC76: Validate the billing type filter on RM project tab", async ({
    jsonDir,
  }) => {
    allure.story("Resource Management : Project Tab");

    // Load billing type test data
    const stubPath = path.join(jsonDir, "TC76.json");
    const data = await readJSONFile(stubPath);
    const TC76data = data.TC76;

    await projectPage.clearFilters();
    await projectPage.searchBar.fill(
      TC76data.infoPayloadCreateProject.project_name,
    ); // Search for the project
    //Wait until the project name is displayed in the table
    await projectPage.waitForOnlyOneElement(projectPage.projectListItems);

    // Capture project list before applying billing type filter
    const projectListBeforeBillingFilter = await projectPage.getProjectList();

    // Apply billing type filter from test data
    await projectPage.applyFilters({
      billingType: TC76data.infoPayloadCreateProject.custom_billing_type,
    });

    // Capture project list after filter is applied
    const projectListAfterBillingFilter = await projectPage.getProjectList();

    // Assert that the filter results are same as before filter results
    expect(projectListAfterBillingFilter).toEqual(
      projectListBeforeBillingFilter,
    );

    // Assert that project list contains project associated with the billing type filter
    const projectNameAfterBillingFilter =
      TC76data.infoPayloadCreateProject.project_name;
    expect(projectListAfterBillingFilter.projectNames).toEqual([
      projectNameAfterBillingFilter,
    ]);
  });

  test("TC78: Validate the allocation type filter on RM project tab", async ({
    jsonDir,
  }) => {
    allure.story("Resource Management : Project Tab");

    const stubPath = path.join(jsonDir, "TC78.json");
    const data = await readJSONFile(stubPath);
    const TC78data = data.TC78;

    await projectPage.clearFilters();
    // Search for the project using the project name from test data
    await projectPage.searchBar.fill(
      TC78data.infoPayloadCreateProject2.project_name,
    );

    // Determine allocation type based on 'is_billable' flag from test data
    const billableStatus = TC78data.infoPayloadCreateAllocation2.is_billable;
    const allocationType = billableStatus === 1 ? "Billable" : "Non-Billable";

    // Apply allocation type filter
    await projectPage.applyFilters({ allocationType: allocationType });

    // Capture project list after allocation filter applied
    const projectListAfterAllocationFilter = await projectPage.getProjectList();

    // Assert that filtered list contains expected project name
    const projectNameAfterAllocationFilter =
      TC78data.infoPayloadCreateProject2.project_name;
    expect(projectListAfterAllocationFilter.projectNames).toEqual([
      projectNameAfterAllocationFilter,
    ]);
  });
  test("TC79: Validate the project-allocated employee list by clicking on the project name", async ({
    jsonDir,
  }) => {
    allure.story("Resource Management : Project Tab");

    const stubPath = path.join(jsonDir, "TC79.json");
    const data = await readJSONFile(stubPath);
    const TC79data = data.TC79;

    await projectPage.clearFilters();
    // Search for the project using the project name from test data
    await projectPage.searchBar.fill(
      TC79data.payloadCreateProject.project_name,
    );

    // Click on the project name to view allocated employees
    await projectPage.expandProjectRow(
      TC79data.payloadCreateProject.project_name,
    );

    // Assert that the allocated employees are displayed correctly
    await expect(
      projectPage.employeeNameCell(TC79data.employeeName),
    ).toBeVisible();
  });

  test("TC80: Validate multiple filters on RM project tab", async ({
    jsonDir,
  }) => {
    allure.story("Resource Management : Project Tab");

    const stubPath = path.join(jsonDir, "TC80.json");
    const data = await readJSONFile(stubPath);
    const TC80data = data.TC80;

    await projectPage.clearFilters();
    await projectPage.searchBar.fill(
      TC80data.infoPayloadCreateProject.project_name,
    ); // Search for the project
    // The assertion below expects infoPayloadCreateProject, so the allocation
    // type must come from that project's own allocation - reading it from
    // ...Allocation2 (a different, non-billable project) contradicted the
    // expectation and could only ever match nothing.
    const billableStatus = TC80data.infoPayloadCreateAllocation.is_billable;
    const allocationType = billableStatus === 1 ? "Billable" : "Non-Billable";

    // Apply multiple filters: allocation type, customer, and billing type
    await projectPage.applyFilters({
      allocationType: allocationType,
      customer: TC80data.infoPayloadCreateAllocation.customer,
      billingType: TC80data.infoPayloadCreateProject.custom_billing_type,
    });

    // Capture filtered project list
    const projectListAfterMultipleFilters = await projectPage.getProjectList();

    // Assert filtered list contains the expected project name
    expect(projectListAfterMultipleFilters.projectNames).toEqual([
      TC80data.infoPayloadCreateProject.project_name,
    ]);
  });
});
test.describe("Resource Management : Project Tab", () => {
  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
    await projectPage.goto();
  });
  // Scope changed: the grid renders a full quarter of week columns and steps by
  // quarter, so the one-week-at-a-time buttons this covered are gone and the
  // "shifted by exactly one week" assertion no longer describes the control.
  // What still holds - and is what the case is really about - is that stepping
  // forward moves the window while keeping its shape, and stepping back returns
  // it exactly. The test-case sheet still describes week buttons.
  test("TC77: Validate Next/Previous quarter change buttons", async ({}) => {
    allure.story("Resource Management : Project Tab");

    await projectPage.clearFilters();

    // Capture initial state
    const initialWeekRanges = await projectPage.getVisibleWeekRanges();
    const initialDayHeaders = await projectPage.getVisibleDayHeaders();
    expect(initialWeekRanges.length).toBeGreaterThan(0);
    expect(initialDayHeaders.length).toBeGreaterThan(0);

    // Next quarter
    await projectPage.nextQuarterButton.click();
    await projectPage.page.waitForTimeout(2000);

    const weekRangesNext = await projectPage.getVisibleWeekRanges();
    const dayHeadersNext = await projectPage.getVisibleDayHeaders();

    // Same shape, different window.
    expect(weekRangesNext.length).toEqual(initialWeekRanges.length);
    expect(dayHeadersNext.length).toEqual(initialDayHeaders.length);
    expect(weekRangesNext[0]).not.toEqual(initialWeekRanges[0]);

    // Previous quarter
    await projectPage.prevQuarterButton.click();
    await projectPage.page.waitForTimeout(2000);

    const weekRangesPrev = await projectPage.getVisibleWeekRanges();
    const dayHeadersPrev = await projectPage.getVisibleDayHeaders();

    expect(weekRangesPrev).toEqual(initialWeekRanges);
    expect(dayHeadersPrev).toEqual(initialDayHeaders);
  });
});
