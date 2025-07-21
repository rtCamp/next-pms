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

  test.only("TC28: Validate search bar functionality", async ({ jsonDir }) => {
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
});
