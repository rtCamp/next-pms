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
      TC28data.payloadCreateProject.project_name,
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

    // This case drives the query-builder seven times (four conditions, a clear,
    // then three more). Each condition is ~10 UI actions and the config sets
    // launchOptions.slowMo = 500, so it cannot fit the default 30s budget -
    // TC112 spends 23s on a single condition. Not flakiness: the trace shows 96
    // actions completing in order before the timeout.
    test.setTimeout(180000);

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
    await projectPage.deletePrivateView(
      TC105data.payloadDeleteView.view_name,
      TC105data.payloadDeleteView.notification,
    );
  });
  test.skip("TC31: The information table columns should be customizable using the ‘Columns’ button at the top.", async () => {
    allure.story("Project");

    //Add columns and verify if they are visible as column headers
    const columnsToCheck = ["Project Name", "Project Type", "Status", "Business Unit", "Billing Type", "Currency"];

    await projectPage.verifyColumnHeaders(columnsToCheck);
    for (const column of columnsToCheck) {
      await projectPage.isColumnHeaderVisible(column);
    }
  });

  test("TC32: Validate the project data sorting functionality.", async () => {
    allure.story("Project");

    // Sorting is applied from the "Sort" panel by field label, and re-picking
    // the same field flips the direction. No ascending/descending control is
    // rendered any more, so the direction is read from the resulting order
    // rather than from an icon.
    await projectPage.sortBy("Project name");

    const firstPass = (await projectPage.getProjectList()).projectNames;
    const ascending = [...firstPass].sort((a, b) => a.localeCompare(b));
    const descending = [...firstPass].sort((a, b) => b.localeCompare(a));
    const startedAscending = JSON.stringify(firstPass) === JSON.stringify(ascending);

    // Whichever way it landed, the list must be ordered by name.
    expect(startedAscending || JSON.stringify(firstPass) === JSON.stringify(descending)).toBeTruthy();

    // Flipping the direction must reorder the list the opposite way.
    await projectPage.sortBy("Project name");

    const secondPass = (await projectPage.getProjectList()).projectNames;
    const expectedSecondPass = [...secondPass].sort((a, b) =>
      startedAscending ? b.localeCompare(a) : a.localeCompare(b),
    );
    expect(secondPass).toEqual(expectedSecondPass);
  });

  test("TC35: Validate the project details page by clicking on the project title.", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC35.json");
    const TC35data = data.TC35;
    const projectName = TC35data.payloadCreateProject.project_name;

    //Search the project by its title
    await projectPage.searchProject(projectName);

    // Click on the project title to navigate to the project details page
    await projectPage.projectNameCell(projectName).click();

    // The redesigned details page has no editable name input (no textboxes at
    // all), so verify the click actually opened that project's detail route.
    await expect(projectPage.page, "Clicking the title opens the project details page").toHaveURL(
      /\/next-pms\/projects\/[A-Za-z0-9-]+$/,
    );
  });

  test("TC106: Verify the details of a project from public view", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC106.json");
    const TC106data = data.TC106;

    // Public and private views now live in one menu behind the "List view"
    // button, so the view is opened by its label rather than from a separate
    // "Public Views" list. The view itself is seeded (payloadCreateView).
    await projectPage.openSavedView(TC106data.publicViewName);

    // The grid pages at ~20 rows and there are more seeded projects than that,
    // so narrow to the project inside the view before reading the list. The
    // search still honours the view's own filters, so a project the view
    // excludes would return nothing and still fail this assertion.
    await projectPage.searchProject(TC106data.payloadCreateProject.project_name);

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

    // The public view is seeded through the admin API (payloadCreateView), so it
    // is owned by someone other than this manager - that ownership is the case
    // being covered.
    //
    // The old assertion read getByText("Delete View"), which no longer matches
    // anything, so it passed without checking anything. Read the actions the
    // redesigned row menu actually offers instead.
    const actions = await projectPage.getViewRowActions(TC118data.publicViewName);

    expect(actions, "A manager who does not own a public view must not be offered Delete").not.toContain("Delete");
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

    // Seven column-header checks, two searches, three filter conditions and a
    // clear, at slowMo's half-second per action. TC113 already records this one
    // as spending ~23s on a single condition, which leaves no headroom under
    // the 30s default - it went over as soon as the filter gained a real wait
    // for the list response.
    test.setTimeout(180000);

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC112.json");
    const TC112data = data.TC112;

    // Verify column headers if they are visible, if not visible, include them
    const columnsToCheck = [
      "Project Name",
      "Project Type",
      "Phase",
      "Total Budget",
      "Burn rate/week",
      "Profit margin",
      "Client name",
    ];

    await projectPage.verifyColumnHeaders(columnsToCheck);
    for (const column of columnsToCheck) {
      await projectPage.isColumnHeaderVisible(column);
    }

    //Search the project
    await projectPage.searchProject(TC112data.payloadCreateProject.project_name);
    // Apply single filter for Project Type and verify results
    const projectListBeforeFilter = await projectPage.getProjectList();
    await projectPage.applyFilters({
      projectType: TC112data.payloadCreateProject.project_type,
    });

    const projectListAfterFilter = await projectPage.getProjectList();

    expect(projectListAfterFilter).toEqual(projectListBeforeFilter);

    const projectName = TC112data.payloadCreateProject.project_name;
    const projectType = TC112data.payloadCreateProject.project_type;

    await expect(
      projectPage.projectTypeCell(projectName, projectType),
      "correct project name along with its project type is displayed",
    ).toBeVisible();

    //clear filters
    await projectPage.clearFilters();

    await projectPage.searchProject("TC112");

    // The filter panel ANDs its conditions and offers no OR, so combining two
    // fields must narrow down to the project matching both.
    await projectPage.applyFilters({
      projectType: TC112data.payloadCreateProject.project_type,
      customer: TC112data.payloadCreateProject.customer,
    });

    await expect(
      projectPage.projectTypeCell(
        TC112data.payloadCreateProject.project_name,
        TC112data.payloadCreateProject.project_type,
      ),
      "Multiple Filters : project matching both conditions is displayed",
    ).toBeVisible({ timeout: 30000 });

    await expect(
      projectPage.projectRow(TC112data.payloadCreateProject2.project_name),
      "Multiple Filters : project of another type is filtered out",
    ).toHaveCount(0);
  });

  // Status is not filterable any more. The Projects filter panel offers
  // Project, Project Manager, Business Unit, Project Type, Billing type,
  // Industry, Customer, Engineering Manager, Account Manager, Host and Tags -
  // no Status - and Status is not a column either, so its value cannot be read
  // per row. Status is only reachable through the ?status= URL parameter that
  // goto() already uses. Skipped rather than deleted pending a call from
  // @ayushnirwal on whether status filtering was dropped deliberately.
  test.skip("TC114: Verify Status Filter", async ({ jsonDir }) => {
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
    await projectPage.applyFilters({
      status: TC114data.createProject3Info.status,
    });

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
      "Multiple Status Filter1 : Correct",
    ).toBeVisible();
    await expect(
      projectPage.statusCell(TC114data.createProject4Info.project_name, TC114data.createProject4Info.status),
      "Multiple Status Filter2 : Correct",
    ).toBeVisible();
  });

  test("TC115: Verify Business Unit Filter", async ({ jsonDir }) => {
    allure.story("Project");
    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC115.json");
    const TC115data = data.TC115;
    // Business Unit is no longer a column and there is no Columns picker, so its
    // value cannot be read per row (headers are fixed: Project name, Phase,
    // Burn rate/week, ...). The Business Unit *filter* field does still exist, so
    // verify the filter's contract instead: it returns the projects in the unit
    // and excludes the ones outside it.
    const matching = TC115data.createProject3Info; // Polaris, Open
    const other = TC115data.createProject4Info; // Jupiter, Open

    ///////////1:  Apply single filter for Business Unit and verify results///////////
    const projectListBeforeFilter = await projectPage.getProjectList();
    await projectPage.applyFilters({ businessUnit: matching.custom_business_unit });
    const projectListAfterFilter = await projectPage.getProjectList();

    expect(projectListAfterFilter).not.toEqual(projectListBeforeFilter);
    expect(projectListAfterFilter.projectNames, "Single Business Unit filter keeps the matching project").toContain(
      matching.project_name,
    );

    // A project in a different unit must be excluded - this is what catches a
    // filter that silently returns everything.
    expect(projectListAfterFilter.projectNames, "Single Business Unit filter excludes other units").not.toContain(
      other.project_name,
    );

    // The original step 2 applied two business units at once and expected both
    // projects back. The filter panel is AND-only now - it has no OR, only a
    // static "And" between conditions - so two conditions on the same field
    // match nothing. Multi-condition filtering across different fields is
    // covered by TC113; there is nothing left for this case to add.
  });

  test("TC116: Verify Billing Type Filter", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC116.json");
    const TC116data = data.TC116;

    // Billing Type is no longer a column and there is no Columns picker, so its
    // value cannot be read per row. The Billing type *filter* field does still
    // exist, so verify the filter's contract: it keeps matching projects and
    // excludes non-matching ones.
    const matching = TC116data.createProject3Info; // Time and Material, Open
    const other = TC116data.createProject4Info; // Fixed Cost, Open

    ///////////1:  Apply single filter for Billing Type and verify results///////////
    const projectListBeforeFilter = await projectPage.getProjectList();
    await projectPage.applyFilters({ billingType: matching.custom_billing_type });
    const projectListAfterFilter = await projectPage.getProjectList();

    expect(projectListAfterFilter).not.toEqual(projectListBeforeFilter);
    expect(projectListAfterFilter.projectNames, "Single Billing Type filter keeps the matching project").toContain(
      matching.project_name,
    );

    // A project with a different billing type must be excluded - this is what
    // catches a filter that silently returns everything.
    expect(
      projectListAfterFilter.projectNames,
      "Single Billing Type filter excludes other billing types",
    ).not.toContain(other.project_name);

    // Same as TC115: the panel is AND-only, so two billing types at once match
    // nothing. Multi-field filtering is covered by TC113.
  });
  /*
  test.only("TC117: Verify Currency Filter", async ({ jsonDir }) => {
    allure.story("Project");

    // Load test data
    const data = await projectPage.loadTestData(jsonDir, "TC117.json");
    const TC117data = data.TC117;
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
