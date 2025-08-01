const { test, expect } = require("../../../playwright.fixture.cjs");
import path from "path";
import { ProjectPage } from "../../../pageObjects/resourceManagement/project";
import * as allure from "allure-js-commons";
import { readJSONFile } from "../../../utils/fileUtils";

test.describe.only("Resource Management : Project Tab Filters", () => {
  /** @type {ProjectPage} */
  let projectPage;

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

    // Capture project list before applying the customer filter
    const projectListBeforeFilter = await projectPage.getProjectList();

    // Apply filter by customer name from test data
    await projectPage.applyFilters({ customer: TC73data.payloadCreateAllocation2.customer });

    // Capture project list after filter is applied
    const projectListAfterFilter = await projectPage.getProjectList();

    // Assert that the project list after applying the filter is different (filtered)
    expect(projectListAfterFilter).not.toEqual(projectListBeforeFilter);

    // Assert that the filtered project list contains the expected project name
    const projectNameAfterCustomerFilter = TC73data.payloadCreateProject.project_name;
    expect(projectListAfterFilter.projectNames).toContain(projectNameAfterCustomerFilter);
  });

  test("TC76: Validate the billing type filter on RM project tab", async ({ page, jsonDir }) => {
    allure.story("Resource Management : Project Tab");

    // Load billing type test data
    const stubPath = path.join(jsonDir, "TC76.json");
    const data = await readJSONFile(stubPath);
    const TC76data = data.TC76;

    await projectPage.clearFilters();

    // Capture project list before applying billing type filter
    const projectListBeforeBillingFilter = await projectPage.getProjectList();

    // Apply billing type filter from test data
    await projectPage.applyFilters({ billingType: TC76data.infoPayloadCreateProject.custom_billing_type });

    // Capture project list after filter is applied
    const projectListAfterBillingFilter = await projectPage.getProjectList();

    // Assert that the filter results differ from before filter results
    expect(projectListAfterBillingFilter).not.toEqual(projectListBeforeBillingFilter);

    // Assert that project list contains project associated with the billing type filter
    const projectNameAfterBillingFilter = TC76data.infoPayloadCreateProject.project_name;
    expect(projectListAfterBillingFilter.projectNames).toContain(projectNameAfterBillingFilter);
  });

  test("TC78: Validate the allocation type filter on RM project tab", async ({ page, jsonDir }) => {
    allure.story("Resource Management : Project Tab");

    const stubPath = path.join(jsonDir, "TC78.json");
    const data = await readJSONFile(stubPath);
    const TC78data = data.TC78;

    await projectPage.clearFilters();

    // Determine allocation type based on 'is_billable' flag from test data
    const billableStatus = TC78data.infoPayloadCreateAllocation2.is_billable;
    const allocationType = billableStatus === 1 ? "Billable" : "Non-Billable";

    // Apply allocation type filter
    await projectPage.applyFilters({ allocationType: allocationType });

    // Capture project list after allocation filter applied
    const projectListAfterAllocationFilter = await projectPage.getProjectList();

    // Assert that filtered list contains expected project name
    const projectNameAfterAllocationFilter = TC78data.infoPayloadCreateProject2.project_name;
    expect(projectListAfterAllocationFilter.projectNames).toContain(projectNameAfterAllocationFilter);
  });

  test("TC80: Validate multiple filters on RM project tab", async ({ page, jsonDir }) => {
    allure.story("Resource Management : Project Tab");

    const stubPath = path.join(jsonDir, "TC80.json");
    const data = await readJSONFile(stubPath);
    const TC80data = data.TC80;

    await projectPage.clearFilters();

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
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC80data.infoPayloadCreateProject.project_name);

    // Use search bar to specifically search the project name
    await projectPage.searchBar.fill(TC80data.infoPayloadCreateProject.project_name);

    // Wait for search results to update
    await projectPage.page.waitForTimeout(3000);

    // Get the search results after filter and search applied
    const searchResult = await projectPage.getProjectList();

    // Assert that search result exactly matches the project name searched
    expect(searchResult.projectNames).toEqual([TC80data.infoPayloadCreateProject.project_name]);
  });
});
