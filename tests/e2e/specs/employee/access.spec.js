const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { NavigationPage } from "../../pageObjects/navigationPage";
import { readJSONFile } from "../../utils/fileUtils";
import { findProjectId } from "../../utils/testCase";

// The routes below send a role without access to the not-found page; the Team timesheet
// one is TC229.
const BLOCKED = ["/dashboard/leadership", "/projects", "/timesheet/project"];
const FIXTURE = "TC388";

test.describe("Employee: Access", () => {
  /** @type {NavigationPage} */ let nav;

  let projectId;

  test.beforeAll(async ({ jsonDir }) => {
    const data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[
      FIXTURE
    ];
    projectId = await findProjectId(data.payloadCreateProject);
  });

  test.beforeEach(async ({ page }) => {
    nav = new NavigationPage(page);
  });

  test("TC388: The employee sidebar shows only Timesheet, Tasks and Allocations", async () => {
    allure.story("Access & Roles");
    await nav.goto("/timesheet");

    await expect(nav.link("/timesheet")).toBeVisible();
    await expect(nav.link("/tasks")).toBeVisible();
    await expect(nav.sectionHeading("Allocations")).toBeVisible();

    // No Dashboards or Timesheet section, and nothing that opens a manager page.
    await expect(nav.sectionHeading("Dashboards")).toHaveCount(0);
    await expect(nav.sectionHeading("Timesheet")).toHaveCount(0);
    for (const route of [
      "/dashboard/leadership",
      "/dashboard/manager",
      "/projects",
      "/timesheet/team",
      "/timesheet/project",
    ]) {
      await expect(nav.link(route), route).toHaveCount(0);
    }
    await expect(nav.notificationsButton).toHaveCount(0);

    await nav.sectionHeading("Allocations").click();
    await expect(nav.link("/allocations/team")).toBeVisible();
    await expect(nav.link("/allocations/project")).toBeVisible();
  });

  test("TC389: An employee opening the Manager dashboard by URL lands on the not-found page", async () => {
    allure.story("Access & Roles");
    await nav.visit("/dashboard/manager");
    await nav.expectNotFound();
  });

  test("TC390: An employee opening the Leadership dashboard, Projects, a project or Project timesheet by URL lands on the not-found page", async () => {
    allure.story("Access & Roles");
    // A project that exists, so the page is refused for the role and not for a missing record.
    for (const route of [...BLOCKED, `/projects/${projectId}`]) {
      await nav.visit(route);
      await nav.expectNotFound();
    }
  });
});
