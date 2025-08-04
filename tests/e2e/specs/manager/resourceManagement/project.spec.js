const { test, expect } = require("../../../playwright.fixture.cjs");
import path from "path";
import { ProjectPage } from "../../../pageObjects/resourceManagement/project";
import * as allure from "allure-js-commons";
import { readJSONFile } from "../../../utils/fileUtils";
import { getFormattedDate, getShortFormattedDate, getDateForWeekday } from "../../../utils/dateUtils";
/** @type {ProjectPage} */
let projectPage;
test.describe("Resource Management : Project Tab -> Filters", () => {
  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
    await projectPage.goto();
  });

  test("TC73: Validate the customer filter on RM project tab", async ({ page, jsonDir }) => {
    allure.story("Resource Management : Project Tab");

    // Load test data from JSON stub file
    const stubPath = path.join(jsonDir, "TC73.json");
    const data = await readJSONFile(stubPath);
    const TC73data = data.TC73;

    await projectPage.clearFilters(); // Clear any existing filters
    await projectPage.searchBar.fill(TC73data.payloadCreateProject.project_name); // Search for the project
await projectPage.page.waitForTimeout(5000); // Mandatory wait to ensure the project is loaded




    // Capture project list before applying the customer filter
    const projectListBeforeFilter = await projectPage.getProjectList();

    // Apply filter by customer name from test data
    await projectPage.applyFilters({ customer: TC73data.payloadCreateAllocation2.customer });

    // Capture project list after filter is applied
    const projectListAfterFilter = await projectPage.getProjectList();

    // Assert that the project list after applying the filter is different (filtered)
    expect(projectListAfterFilter).toEqual(projectListBeforeFilter);

    // Assert that the filtered project list contains the expected project name
    const projectNameAfterCustomerFilter = TC73data.payloadCreateProject.project_name;
    expect(projectListAfterFilter.projectNames).toEqual([projectNameAfterCustomerFilter]);
  });

  test("TC76: Validate the billing type filter on RM project tab", async ({ page, jsonDir }) => {
    allure.story("Resource Management : Project Tab");

    // Load billing type test data
    const stubPath = path.join(jsonDir, "TC76.json");
    const data = await readJSONFile(stubPath);
    const TC76data = data.TC76;

    await projectPage.clearFilters();
    await projectPage.searchBar.fill(TC76data.infoPayloadCreateProject.project_name); // Search for the project
    await projectPage.page.pause();
    // Capture project list before applying billing type filter
    const projectListBeforeBillingFilter = await projectPage.getProjectList();

    // Apply billing type filter from test data
    await projectPage.applyFilters({ billingType: TC76data.infoPayloadCreateProject.custom_billing_type });

    // Capture project list after filter is applied
    const projectListAfterBillingFilter = await projectPage.getProjectList();

    // Assert that the filter results are same as before filter results
    expect(projectListAfterBillingFilter).toEqual(projectListBeforeBillingFilter);

    // Assert that project list contains project associated with the billing type filter
    const projectNameAfterBillingFilter = TC76data.infoPayloadCreateProject.project_name;
    expect(projectListAfterBillingFilter.projectNames).toEqual([projectNameAfterBillingFilter]);
  });

  test("TC78: Validate the allocation type filter on RM project tab", async ({ page, jsonDir }) => {
    allure.story("Resource Management : Project Tab");

    const stubPath = path.join(jsonDir, "TC78.json");
    const data = await readJSONFile(stubPath);
    const TC78data = data.TC78;

    await projectPage.clearFilters();
    // Search for the project using the project name from test data
    await projectPage.searchBar.fill(TC78data.infoPayloadCreateProject2.project_name);

    // Determine allocation type based on 'is_billable' flag from test data
    const billableStatus = TC78data.infoPayloadCreateAllocation2.is_billable;
    const allocationType = billableStatus === 1 ? "Billable" : "Non-Billable";

    // Apply allocation type filter
    await projectPage.applyFilters({ allocationType: allocationType });

    // Capture project list after allocation filter applied
    const projectListAfterAllocationFilter = await projectPage.getProjectList();

    // Assert that filtered list contains expected project name
    const projectNameAfterAllocationFilter = TC78data.infoPayloadCreateProject2.project_name;
    expect(projectListAfterAllocationFilter.projectNames).toEqual([projectNameAfterAllocationFilter]);
  });

  test("TC80: Validate multiple filters on RM project tab", async ({ page, jsonDir }) => {
    allure.story("Resource Management : Project Tab");

    const stubPath = path.join(jsonDir, "TC80.json");
    const data = await readJSONFile(stubPath);
    const TC80data = data.TC80;

    await projectPage.clearFilters();
    await projectPage.searchBar.fill(TC80data.infoPayloadCreateProject.project_name); // Search for the project
    // Determine allocation type filter value based on test data
    const billableStatus = TC80data.infoPayloadCreateAllocation2.is_billable;
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
    expect(projectListAfterMultipleFilters.projectNames).toEqual([TC80data.infoPayloadCreateProject.project_name]);
  });
});
test.describe("Resource Management : Project Tab", () => {
  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
    await projectPage.goto();
  });
  test("TC74: Validate the type of sheet view from the top menu and select field", async ({ page, jsonDir }) => {
    allure.story("Resource Management : Project Tab");

    // Load test data from JSON stub file
    const stubPath = path.join(jsonDir, "TC74.json");
    const data = await readJSONFile(stubPath);
    const TC74data = data.TC74;

    // Clear any existing filters
    await projectPage.clearFilters();

    //Search the Project
    await projectPage.searchBar.fill(TC74data.payloadCreateProject.project_name);

    //1.1 Planned view
    await projectPage.chooseSheetView("Planned");
    //Assertion :
    await expect(
      projectPage.projectNameWithDate(
        TC74data.payloadCreateProject.project_name,
        TC74data.payloadCreateAllocation.allocation_start_date
      ),
      "Verify if the Planned hour = 1"
    ).toHaveText(TC74data.payloadCreateAllocation.hours_allocated_per_day);

    //1.2 Verify combined weekly hour for the Planned view
    await projectPage.combineWeekHoursCheckbox.check();
    const wednesdayDate = new Date(TC74data.payloadCreateAllocation.allocation_start_date);
    wednesdayDate.setDate(wednesdayDate.getDate() + 2); // Move to Wednesday
    const formattedWednesday = getFormattedDate(wednesdayDate); // Format as YYYY-MM-DD
    const expectedCombinedHours = TC74data.payloadCreateAllocation.hours_allocated_per_day * 5;
    await expect(
      projectPage.projectNameWithDate(TC74data.payloadCreateProject.project_name, formattedWednesday),
      "combined weekly hour for the Planned view is correct"
    ).toHaveText(expectedCombinedHours.toString());
    await projectPage.combineWeekHoursCheckbox.uncheck();

    //2.1 Apply "Actual vs Planned" view
    await projectPage.chooseSheetView("Actual vs Planned");

    //Assertion : Verify if the Actual vs Planned hours
    const actual_vs_planned_hours =
      TC74data.payloadCreateTimesheet.hours + " / " + TC74data.payloadCreateAllocation.hours_allocated_per_day;
    await expect(
      projectPage.projectNameWithDate(
        TC74data.payloadCreateProject.project_name,
        TC74data.payloadCreateAllocation.allocation_start_date
      ),
      "Actual vs Planned hours is shown correctly"
    ).toHaveText(actual_vs_planned_hours);

    //2.2 Verify combined weekly hour for the Actual vs Planned view
    await projectPage.combineWeekHoursCheckbox.check();
    await expect(
      projectPage.projectNameWithDate(TC74data.payloadCreateProject.project_name, formattedWednesday),
      "combined weekly hour for the Actual vs Planned view is correct"
    ).toHaveText(TC74data.payloadCreateTimesheet.hours + " / " + expectedCombinedHours.toString());
    await projectPage.combineWeekHoursCheckbox.uncheck();
  });
  test("TC77: Validate Next/Previous week change buttons", async ({ jsonDir }) => {
    allure.story("Resource Management : Project Tab");
    const stubPath = path.join(jsonDir, "TC77.json");
    const data = await readJSONFile(stubPath);
    const TC77data = data.TC77;

    await projectPage.clearFilters();

    // Capture initial state
    const initialWeekRanges = await projectPage.getVisibleWeekRanges();
    const initialDayHeaders = await projectPage.getVisibleDayHeaders();

    // Next week
    await projectPage.nextButton.click();
    await projectPage.page.waitForTimeout(500);

    const weekRangesNext = await projectPage.getVisibleWeekRanges();
    const dayHeadersNext = await projectPage.getVisibleDayHeaders();

    expect(weekRangesNext.length).toEqual(initialWeekRanges.length);
    expect(weekRangesNext.slice(0, -1)).toEqual(initialWeekRanges.slice(1));
    expect(dayHeadersNext.length).toEqual(initialDayHeaders.length);

    // Previous week
    await projectPage.prevButton.click();
    await projectPage.page.waitForTimeout(500);

    const weekRangesPrev = await projectPage.getVisibleWeekRanges();
    const dayHeadersPrev = await projectPage.getVisibleDayHeaders();

    expect(weekRangesPrev).toEqual(initialWeekRanges);
    expect(dayHeadersPrev).toEqual(initialDayHeaders);
  });
});
