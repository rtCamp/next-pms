const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { AllocationsPage } from "../../pageObjects/resourceManagement/allocations";
import { allocationWeekLabel } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";

// TC265 seeds the members and allocations; see data/manager/allocations.js.
const FIXTURE = "TC265";

test.describe("Employee: Allocations", () => {
  /** @type {AllocationsPage} */ let al;
  let member;

  test.beforeEach(async ({ page, jsonDir }) => {
    al = new AllocationsPage(page);
    const data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[
      FIXTURE
    ];
    member = Object.fromEntries(
      Object.entries(data.employees).map(([key, { name }]) => [key, name]),
    );
  });

  test("TC287: An employee sees the Team allocations grid read-only", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: member.AlDev });
    await expect(al.row(member.AlDev)).toBeVisible();
    await expect(al.addAllocatioButtton).toHaveCount(0);
    await expect(al.filterButton).toHaveCount(0);
    await expect(al.pickers).toHaveCount(0);

    const popover = await al.openChip(member.AlDev);
    await expect(popover).toContainText("E2E Alloc Alpha");
    await expect(
      popover.getByRole("button", { name: /^(Edit|Delete) allocation$/ }),
    ).toHaveCount(0);
  });

  test("TC288: An employee can search members and change Duration, Previous, Today and Next on the Team grid", async ({
    page,
  }) => {
    allure.story("Allocations");
    await al.goto("team");
    await al.searchEmployeeFilter.fill(member.AlQa);
    await expect.poll(() => al.rowNames()).toEqual([member.AlQa]);

    await al.chooseDuration("This week");
    await expect(page).toHaveURL(/duration=this-week/);
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(0)]);
    await al.navButton("next", "week").click();
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(-1)]);
    await al.navButton("previous", "week").click();
    await al.navButton("previous", "week").click();
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(1)]);
    await al.todayButton.click();
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(0)]);
  });

  test("TC296: An employee sees the Project allocations grid read-only", async () => {
    allure.story("Allocations");
    await al.goto("project", { search: "E2E Alloc" });
    await expect.poll(() => al.rowNames()).toContain("E2E Alloc Alpha");
    await expect(al.searchProjectFilter).toBeVisible();
    await expect(al.addAllocatioButtton).toHaveCount(0);
    await expect(al.filterButton).toHaveCount(0);
  });
});
