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
  test("TC29: Create a project using the + Project button", async ({ jsonDir }) => {
    allure.story("Project");

    const stubPath = path.join(jsonDir, "TC29.json");
    const data = await readJSONFile(stubPath);
    const TC29data = data.TC29;

    // Create a project using the + Project button
    await projectPage.createProject(TC29data.createProjectByUI);
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
    await projectPage.clearFilters(["projectType", "businessUnit", "billingType", "currency"]);

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
  test("TC31: The information table columns should be customizable using the ‘Columns’ button at the top.", async () => {
    allure.story("Project");

    //Add columns and verify if they are visible as column headers
    const columnsToCheck = ["Project Name", "Project Type", "Status", "Business Unit", "Billing Type", "Currency"];

    await projectPage.verifyColumnHeaders(columnsToCheck);
    for (const column of columnsToCheck) {
      await projectPage.isColumnHeaderVisible(column);
    }
  });

  test("TC32: Validate the project data sorting functionality.", async ({ jsonDir }) => {
    allure.story("Project");

    // Apply project name sorting
    await projectPage.sortByButton("modified").click();
    await projectPage.page.getByRole("menuitemcheckbox", { name: "Project Name" }).click();

    // Ensure ascending sort is active
    if (!(await projectPage.sortAscending.isVisible())) {
      if (await projectPage.sortDescending.isVisible()) {
        await projectPage.sortDescending.click();
      } else {
        throw new Error("Neither sort button is visible");
      }
    }

    // Assert ascending sort button is active
    await expect(projectPage.sortAscending, "Ascending sort button is visible").toBeVisible();

    // Get actual project names
    const { projectNames } = await projectPage.getProjectList();
    //console.log("Project Names After Sort:", projectNames);

    // Verify if sorted correctly
    const sortedNames = [...projectNames].sort((a, b) => a.localeCompare(b));
    expect(projectNames).toEqual(sortedNames);

    //Apply descending order sort and verify
    await projectPage.sortAscending.click();

    // Get project names after descending sort
    const projectListAfterDescendingSort = await projectPage.getProjectList();
    //console.log("Project Names After Descending Sort:", projectListAfterDescendingSort.projectNames);
    // Verify if sorted correctly in descending order
    const sortedNamesDescending = [...projectListAfterDescendingSort.projectNames].sort((a, b) => b.localeCompare(a));
    expect(projectListAfterDescendingSort.projectNames).toEqual(sortedNamesDescending);
  });

  test("TC35: Validate the project details page by clicking on the project title.", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC35.json");
    const TC35data = data.TC35;
    const projectName = TC35data.payloadCreateProject.project_name;

    // Click on the project title to navigate to the project details page
    await projectPage.projectNameCell(projectName).click();
    const inputField = projectPage.page.locator(`input[value="${projectName}"]`);
    await inputField.waitFor({ state: "visible" });
    await expect(inputField, "Project name input field is visible").toBeVisible();
  });

  test("TC106: Verify the details of a project from public view", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC106.json");
    const TC106data = data.TC106;

    //Verify the project name to be shown in public view : Retainer
    await projectPage.publicViewsButton.click();
    await projectPage.gotoPublicView(TC106data.publicViewName).click();

    //Get list of project names, verify if the project name is one among the list
    const projectList = await projectPage.getProjectListInRetainerView();
    //console.log("Project Names in Retainer Public View:", projectList.projectNames);
    expect(projectList.projectNames).toContain(TC106data.payloadCreateProject.project_name);
  });
  test("TC118: There should be no delete view option for a public view for manager", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC118.json");
    const TC118data = data.TC118;

    //Verify the project name to be shown in public view : Retainer
    await projectPage.publicViewsButton.click();
    await projectPage.gotoPublicView(TC118data.publicViewName).click();
    //Verify delete view button is not visible
    await projectPage.moreActionsButton.click();
    await expect(projectPage.deleteView, "Delete view is not present for public view").not.toBeVisible();
  });
});

test.describe("Project Tab: Single Filters", () => {
  /** @type {ProjectPage} */ let projectPage;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
    // go to project page
    await projectPage.goto();
  });
  test("TC112: Verify project Type Filter", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC112.json");
    const TC112data = data.TC112;

    // Verify column headers if they are visible, if not visible, include them
    const columnsToCheck = ["Project Name", "Project Type", "Status", "Business Unit", "Billing Type", "Currency"];

    await projectPage.verifyColumnHeaders(columnsToCheck);
    for (const column of columnsToCheck) {
      await projectPage.isColumnHeaderVisible(column);
    }
    // Apply single filter for Project Type and verify results
    const projectListBeforeFilter = await projectPage.getProjectList();
    await projectPage.applyFilters({ projectType: TC112data.payloadCreateProject.project_type });

    const projectListAfterFilter = await projectPage.getProjectList();

    expect(projectListAfterFilter).not.toEqual(projectListBeforeFilter);

    const projectName = TC112data.payloadCreateProject.project_name;
    const projectType = TC112data.payloadCreateProject.project_type;

    await expect(
      projectPage.projectTypeCell(projectName, projectType),
      "correct project name along with its project type is displayed"
    ).toBeVisible();

    //clear filters
    // To clear only projectType
    await projectPage.clearFilters(["projectType"]);

    // Apply multiple filters for Project Type and verify results
    await projectPage.applyFilters({
      projectType: [TC112data.payloadCreateProject.project_type, TC112data.payloadCreateProject2.project_type],
    });
    const projectListAfterMultipleFilters = await projectPage.getProjectList();
    //console.log("Project Names After applying multiple filters:", projectListAfterMultipleFilters.projectNames);
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC112data.payloadCreateProject.project_name);
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC112data.payloadCreateProject2.project_name);

    await expect(
      projectPage.projectTypeCell(
        TC112data.payloadCreateProject.project_name,
        TC112data.payloadCreateProject.project_type
      ),
      "Multiple Filter1 : correct project name along with its project type is displayed"
    ).toBeVisible();

    await expect(
      projectPage.projectTypeCell(
        TC112data.payloadCreateProject2.project_name,
        TC112data.payloadCreateProject2.project_type
      ),
      "Multiple Filter2 : correct project name along with its project type is displayed"
    ).toBeVisible();
  });

  test("TC114: Verify Status Filter", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC114.json");
    const TC114data = data.TC114;

    // Verify column headers if they are visible, if not visible, include them
    const columnsToCheck = ["Project Name", "Status"];

    await projectPage.verifyColumnHeaders(columnsToCheck);
    for (const column of columnsToCheck) {
      await projectPage.isColumnHeaderVisible(column);
    }
    ///////////1:  Apply single filter for Status and verify results///////////
    const projectListBeforeFilter = await projectPage.getProjectList();
    await projectPage.applyFilters({ status: TC114data.createProject3Info.status });

    const projectListAfterFilter = await projectPage.getProjectList();

    expect(projectListAfterFilter).not.toEqual(projectListBeforeFilter);

    const projectName = TC114data.createProject3Info.project_name;
    const status = TC114data.createProject3Info.status;

    await expect(projectPage.statusCell(projectName, status), "Single Status Filter : Correct").toBeVisible();

    await projectPage.clearFilters(["status"]);

    ///////////2:Apply multiple filters for Status and verify results///////////
    await projectPage.applyFilters({
      status: [TC114data.createProject3Info.status, TC114data.createProject4Info.status],
    });
    const projectListAfterMultipleFilters = await projectPage.getProjectList();
    console.log("Project Names After applying multiple status filters:", projectListAfterMultipleFilters.projectNames);
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC114data.createProject3Info.project_name);
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC114data.createProject4Info.project_name);
    await expect(
      projectPage.statusCell(TC114data.createProject3Info.project_name, TC114data.createProject3Info.status),
      "Multiple Status Filter1 : Correct"
    ).toBeVisible();
    await expect(
      projectPage.statusCell(TC114data.createProject4Info.project_name, TC114data.createProject4Info.status),
      "Multiple Status Filter2 : Correct"
    ).toBeVisible();
  });

  test("TC115: Verify Business Unit Filter", async ({ jsonDir }) => {
    allure.story("Project");
    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC115.json");
    const TC115data = data.TC115;
    // Verify column headers if they are visible, if not visible, include them
    const columnsToCheck = ["Project Name", "Business Unit"];
    await projectPage.verifyColumnHeaders(columnsToCheck);
    for (const column of columnsToCheck) {
      await projectPage.isColumnHeaderVisible(column);
    }
    ///////////1:  Apply single filter for Business Unit and verify results///////////
    const projectListBeforeFilter = await projectPage.getProjectList();
    await projectPage.applyFilters({ businessUnit: TC115data.createProject3Info.custom_business_unit });
    const projectListAfterFilter = await projectPage.getProjectList();
    expect(projectListAfterFilter).not.toEqual(projectListBeforeFilter);
    const projectName = TC115data.createProject3Info.project_name;
    const businessUnit = TC115data.createProject3Info.custom_business_unit;
    await expect(
      projectPage.businessUnitCell(projectName, businessUnit),
      "Single Business Unit Filter : Correct"
    ).toBeVisible();
    await projectPage.clearFilters(["businessUnit"]);
    ///////////2:Apply multiple filters for Business Unit and verify results///////////
    await projectPage.applyFilters({
      businessUnit: [
        TC115data.createProject3Info.custom_business_unit,
        TC115data.createProject4Info.custom_business_unit,
      ],
    });
    const projectListAfterMultipleFilters = await projectPage.getProjectList();
    /*
    console.log(
      "Project Names After applying multiple business unit filters:",
      projectListAfterMultipleFilters.projectNames
    );
    */
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC115data.createProject3Info.project_name);
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC115data.createProject4Info.project_name);
    await expect(
      projectPage.businessUnitCell(
        TC115data.createProject3Info.project_name,
        TC115data.createProject3Info.custom_business_unit
      ),
      "Multiple Business Unit Filter1 : Correct"
    ).toBeVisible();
    await expect(
      projectPage.businessUnitCell(
        TC115data.createProject4Info.project_name,
        TC115data.createProject4Info.custom_business_unit
      ),
      "Multiple Business Unit Filter2 : Correct"
    ).toBeVisible();
  });

  test("TC116: Verify Billing Type Filter", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC116.json");
    const TC116data = data.TC116;

    // Verify column headers if they are visible, if not visible, include them
    const columnsToCheck = ["Project Name", "Billing Type"];
    await projectPage.verifyColumnHeaders(columnsToCheck);
    for (const column of columnsToCheck) {
      await projectPage.isColumnHeaderVisible(column);
    }

    ///////////1:  Apply single filter for Billing Type and verify results///////////
    const projectListBeforeFilter = await projectPage.getProjectList();
    await projectPage.applyFilters({ billingType: TC116data.createProject3Info.custom_billing_type });
    const projectListAfterFilter = await projectPage.getProjectList();
    expect(projectListAfterFilter).not.toEqual(projectListBeforeFilter);
    const projectName = TC116data.createProject3Info.project_name;
    const billingType = TC116data.createProject3Info.custom_billing_type;
    await expect(
      projectPage.billingTypeCell(projectName, billingType),
      "Single Billing Type Filter : Correct"
    ).toBeVisible();
    await projectPage.clearFilters(["billingType"]);

    ///////////2:Apply multiple filters for Billing Type and verify results///////////
    await projectPage.applyFilters({
      billingType: [TC116data.createProject3Info.custom_billing_type, TC116data.createProject4Info.custom_billing_type],
    });
    const projectListAfterMultipleFilters = await projectPage.getProjectList();
    /*
    console.log(
      "Project Names After applying multiple billing type filters:",
      projectListAfterMultipleFilters.projectNames
    );
    */
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC116data.createProject3Info.project_name);
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC116data.createProject4Info.project_name);
    await expect(
      projectPage.billingTypeCell(
        TC116data.createProject3Info.project_name,
        TC116data.createProject3Info.custom_billing_type
      ),
      "Multiple Billing Type Filter1 : Correct"
    ).toBeVisible();
    await expect(
      projectPage.billingTypeCell(
        TC116data.createProject4Info.project_name,
        TC116data.createProject4Info.custom_billing_type
      ),
      "Multiple Billing Type Filter2 : Correct"
    ).toBeVisible();
  });
  /*
  test.only("TC117: Verify Currency Filter", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC117.json");
    const TC117data = data.TC117;
    await projectPage.page.pause();
    // Verify column headers if they are visible, if not visible, include them
    const columnsToCheck = ["Project Name", "Currency"];
    await projectPage.verifyColumnHeaders(columnsToCheck);
    for (const column of columnsToCheck) {
      await projectPage.isColumnHeaderVisible(column);
    }

    ///////////1:  Apply single filter for Currency and verify results///////////
    const projectListBeforeFilter = await projectPage.getProjectList();
    await projectPage.applyFilters({ currency: TC117data.createProject3Info.custom_currency });
    const projectListAfterFilter = await projectPage.getProjectList();
    expect(projectListAfterFilter).not.toEqual(projectListBeforeFilter);
    const projectName = TC117data.createProject3Info.project_name;
    const currency = TC117data.createProject3Info.custom_currency;
    await projectPage.currencyCell(projectName, currency).waitFor({ state: "visible" });
    await expect(projectPage.currencyCell(projectName, currency), "Single Currency Filter : Correct").toBeVisible();
    await projectPage.clearFilters(["currency"]);

    ///////////2:Apply multiple filters for Currency and verify results///////////
    await projectPage.applyFilters({
      currency: [TC117data.createProject3Info.custom_currency, TC117data.createProject4Info.currency],
    });
    const projectListAfterMultipleFilters = await projectPage.getProjectList();
    console.log(
      "Project Names After applying multiple currency filters:",
      projectListAfterMultipleFilters.projectNames
    );
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC117data.createProject3Info.project_name);
    expect(projectListAfterMultipleFilters.projectNames).toContain(TC117data.createProject4Info.project_name);
    await expect(
      projectPage.currencyCell(TC117data.createProject3Info.project_name, TC117data.createProject3Info.custom_currency),
      "Multiple Currency Filter1 : Correct"
    ).toBeVisible();
    await expect(
      projectPage.currencyCell(TC117data.createProject4Info.project_name, TC117data.createProject4Info.currency),
      "Multiple Currency Filter2 : Correct"
    ).toBeVisible();
  });
  */
});
