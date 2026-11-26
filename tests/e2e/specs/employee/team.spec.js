const { test, expect } = require("../../playwright.fixture.cjs");
import { NavigationPage } from "../../pageObjects/navigationPage";
import * as allure from "allure-js-commons";

let nav;

test.describe("Employee : Team Tab", () => {
  test.beforeEach(async ({ page }) => {
    nav = new NavigationPage(page);
    await nav.goto("/timesheet");
  });

  test("TC52: Verify the 'Team' tab isn't displayed for an employee.", async () => {
    allure.story("Team");
    // The sidebar's "Team" under Allocations is the Team allocations page, open to
    // everyone; the Team timesheet is the tab this case is about.
    await expect(nav.link("/timesheet")).toBeVisible();
    await expect(nav.link("/timesheet/team")).toHaveCount(0);
  });
});
