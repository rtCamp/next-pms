const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { NavigationPage } from "../../pageObjects/navigationPage";

// Tips the manager gets (TC410) that need a role the employee lacks, next to one each page
// shows everyone.
const ROLE_TIPS = [
  [
    "/allocations/team",
    "Hover a bar to open its card",
    ["Add an allocation", "Allocate straight from the grid"],
  ],
  [
    "/tasks",
    "Add time from a task",
    ["Open a task's time log from its subject"],
  ],
];

test.describe("Employee: Help panel", () => {
  test("TC415: The Help panel leaves out the tips for actions the employee's roles don't allow", async ({
    page,
  }) => {
    allure.story("Global & Navigation");
    const nav = new NavigationPage(page);
    for (const [route, shown, hidden] of ROLE_TIPS) {
      await nav.goto(route);
      await nav.openHelp();
      await expect(nav.helpTips("On this page"), route).toContainText([shown]);
      const titles = await nav.helpTips("On this page").allInnerTexts();
      for (const title of hidden) expect(titles, route).not.toContain(title);
      await nav.closeHelp.click();
    }
  });
});
