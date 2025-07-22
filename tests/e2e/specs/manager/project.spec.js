const { test, expect } = require("../../playwright.fixture.cjs");
import path from "path";
import { ProjectPage } from "../../pageObjects/projectPage";
import { readJSONFile } from "../../utils/fileUtils";
import * as allure from "allure-js-commons";

test.describe("Project Tab", () => {
  /** @type {ProjectPage} */ let projectPage;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
    // go to project page
    await projectPage.goto();
  });

  test("TC28: Validate search bar functionality", async ({ jsonDir }) => {
    allure.story("Project");

    const stubPath = path.join(jsonDir, "TC28.json");
    const data = await readJSONFile(stubPath);
    const TC28data = data.TC28;

    //List of project before search
    const projectListBeforeSearch = await projectPage.getProjectList();
    //console.log("Project Names Before Search:", projectListBeforeSearch.projectNames);
    //console.log("Total Count Before Search:", projectListBeforeSearch.totalCount);

    //List of projects after search
    await projectPage.searchProject(TC28data.payloadCreateProject.project_name);
    const projectListAfterSearch = await projectPage.getProjectList();
    //console.log("Project Names After Search:", projectListAfterSearch.projectNames);
    //console.log("Total Count After Search:", projectListAfterSearch.totalCount);

    // Assertions:
    expect(projectListBeforeSearch).not.toEqual(projectListAfterSearch);

    expect(projectListAfterSearch.totalCount, "Total count of projects = 1 ").toBe(1);
    expect(projectListAfterSearch.projectNames[0], "Correct project name is displayed").toEqual(
      TC28data.payloadCreateProject.project_name
    );
  });
  test("TC113: Verify multiple filter results for project tab", async ({ jsonDir }) => {
    allure.story("Project");

    const stubPath = path.join(jsonDir, "TC113.json");
    const data = await readJSONFile(stubPath);
    const TC113data = data.TC113;

    //Filter : Positive test case
    const filters = {
      projectType: TC113data.payloadCreateProject.project_type, // e.g. "Fixed Cost"
      businessUnit: TC113data.payloadCreateProject.custom_business_unit, // e.g. "Polaris"
      billingType: TC113data.payloadCreateProject.custom_billing_type, // e.g. "Fixed Cost"
      currency: TC113data.payloadCreateProject.currency, // e.g. "INR"
    };

    // Apply all provided filters in one go
    await projectPage.applyFilters(filters);

    //Assertion: Verify if the project name = TC113 Project: Fixed Cost is displayed
    const projectListAfterFilter = await projectPage.getProjectList();
    console.log("Project Names After Filter:", projectListAfterFilter.projectNames);
    expect(projectListAfterFilter.projectNames).toContain(TC113data.payloadCreateProject.project_name);

    //Clear all applied filters
    await projectPage.clearAllFilters();

    //Filter : Negative test case
    const negativeFilters = {
      projectType: TC113data.payloadCreateProject2.project_type,
      businessUnit: TC113data.payloadCreateProject.custom_business_unit,
      billingType: TC113data.payloadCreateProject3.billing_type,
      currency: TC113data.payloadCreateProject3.custom_currency,
    };

    // Apply all provided filters in one go
    await projectPage.applyFilters(negativeFilters);

    //Assertion: Verify if the "No results" message is displayed
    const isNoResultsVisible = await projectPage.isNoResultsVisible();
    expect(isNoResultsVisible).toBeTruthy();
  });

  test("TC105: Create a private view", async ({ jsonDir }) => {
    allure.story("Project");

    const stubPath = path.join(jsonDir, "TC105.json");
    const data = await readJSONFile(stubPath);
    const TC105data = data.TC105;

    // Create a private view
    await projectPage.createPrivateView(TC105data.payloadCreateView.view_name);

    //Delete view
    await projectPage.deleteView(TC105data.payloadDeleteView.view_name, TC105data.payloadDeleteView.notification);
  });
});
