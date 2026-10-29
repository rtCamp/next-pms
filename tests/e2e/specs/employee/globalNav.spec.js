const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { NavigationPage } from "../../pageObjects/navigationPage";

const EMPLOYEE_TARGETS = ["Timesheet - Personal", "Allocations - Team", "Allocations - project", "Tasks"];

const sorted = (list) => [...list].sort();

test.describe("Employee: Global search", () => {
  /** @type {NavigationPage} */ let nav;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationPage(page);
    await nav.goto("/timesheet");
  });

  test("TC400: Global search opens from the sidebar and Ctrl+K, lists the navigation targets, narrows as you type and opens the one chosen", async ({
    page,
  }) => {
    allure.story("Global & Navigation");
    await nav.openSearch();
    await expect(nav.searchResults).toHaveCount(EMPLOYEE_TARGETS.length);
    expect(sorted(await nav.searchResults.allInnerTexts())).toEqual(sorted(EMPLOYEE_TARGETS));

    expect(sorted(await nav.searchFor("Allocations"))).toEqual(["Allocations - Team", "Allocations - project"]);
    await nav.searchFor("zzz-no-such-page");
    await expect(nav.noSearchResults).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(nav.searchInput).toBeHidden();
    await page.keyboard.press("Control+k");
    await expect(nav.searchInput).toBeVisible();

    await nav.searchFor("Tasks");
    await nav.searchResults.filter({ hasText: /^Tasks$/ }).click();
    await expect(page).toHaveURL(/\/next-pms\/tasks/);
    await expect(nav.searchInput).toBeHidden();
  });

  test("TC401: Global search lists only the destinations the role can open: an employee gets four, the manager also gets Dashboards, Projects, Team and Project timesheets", async ({
    browser,
  }) => {
    allure.story("Global & Navigation");
    await nav.openSearch();
    for (const query of ["Dashboard", "Projects", "Timesheet - Team", "Timesheet - Projects"]) {
      await nav.searchFor(query);
      await expect(nav.noSearchResults, query).toBeVisible();
    }
    expect(sorted(await nav.searchFor("Timesheet"))).toEqual(["Timesheet - Personal"]);

    // The manager holds Projects Manager and Timesheet Manager.
    const context = await browser.newContext({
      baseURL: process.env.BASE_URL,
      storageState: path.resolve(__dirname, "../../auth/manager.json"),
    });
    try {
      const manager = new NavigationPage(await context.newPage());
      await manager.goto("/timesheet");
      await manager.openSearch();
      const found = async (query) => sorted(await manager.searchFor(query));
      expect(await found("Dashboard")).toEqual(["Dashboard - Leadership", "Dashboard - Manager"]);
      expect(await found("Timesheet")).toEqual(["Timesheet - Personal", "Timesheet - Projects", "Timesheet - Team"]);
      expect(await found("Projects")).toEqual(["Projects", "Timesheet - Projects"]);
      expect(await found("Allocations")).toEqual(["Allocations - Team", "Allocations - project"]);
    } finally {
      await context.close();
    }
  });
});
