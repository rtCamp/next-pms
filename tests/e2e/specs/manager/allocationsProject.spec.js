const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { AllocationsPage } from "../../pageObjects/resourceManagement/allocations";
import { allocationWeekLabel } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";

// TC265 seeds both projects and their allocations; see data/manager/allocations.js.
const FIXTURE = "TC265";
const SEARCH = "E2E Alloc";
const ALPHA = "E2E Alloc Alpha";
const BETA = "E2E Alloc Beta";

test.describe("Manager: Allocations project", () => {
  /** @type {AllocationsPage} */ let al;
  let data;

  test.beforeEach(async ({ page, jsonDir }) => {
    al = new AllocationsPage(page);
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
  });

  const projects = async () => (await al.rowNames()).sort();

  test("TC298: A project row expands to its allocated members with their hours", async () => {
    allure.story("Allocations");
    const { AlQa, AlDrag } = data.employees;
    await al.goto("project", { search: BETA });
    await expect(al.row(AlQa.name)).toHaveCount(0);
    await al.expandRow(BETA);
    for (const [name, hours] of [
      [AlQa.name, "2h/day for 5 days"],
      [AlDrag.name, "2h/day for 1 day"],
      [process.env.EMP3_NAME, "8h/day for 1 day"],
    ]) {
      await expect(al.row(name)).toContainText(hours);
    }
    await expect(al.row(data.employees.AlDev.name)).toHaveCount(0);
  });

  test("TC289: A project's hover card shows its customer, dates and remaining hours, and links to the project", async () => {
    allure.story("Allocations");
    await al.goto("project", { search: ALPHA });
    const card = await al.hoverCard(ALPHA);
    await expect(card).toContainText("QA-INR");
    await expect(card).toContainText(/[A-Z][a-z]{2} \d+ - [A-Z][a-z]{2} \d+/);
    await expect(card).toContainText(/\d+(\.\d+)?h remaining/);
    await expect(
      card.getByRole("link", { name: "Open project" }),
    ).toHaveAttribute(
      "href",
      `/next-pms/projects/${data.payloadDeleteProject.projectId}`,
    );
  });

  test("TC290: Duration and Previous, Today and Next move the Project grid", async ({
    page,
  }) => {
    allure.story("Allocations");
    await al.goto("project", { search: SEARCH });
    await al.chooseDuration("This week");
    await expect(page).toHaveURL(/duration=this-week/);
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(0)]);
    await al.navButton("next", "week").click();
    await al.navButton("next", "week").click();
    // The seeded allocations sit two weeks ahead.
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(-2)]);
    await expect.poll(projects).toEqual([ALPHA, BETA]);
    await al.navButton("previous", "week").click();
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(-1)]);
    await al.todayButton.click();
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(0)]);

    await al.chooseDuration("This month");
    const month = await al.headerText();
    await al.navButton("next", "month").click();
    await expect.poll(() => al.headerText()).not.toBe(month);
    await al.todayButton.click();
    await expect.poll(() => al.headerText()).toBe(month);
  });

  test("TC291: Search project narrows the list to the matching projects", async ({
    page,
  }) => {
    allure.story("Allocations");
    await al.goto("project");
    await al.searchProjectFilter.fill(SEARCH);
    await expect(page).toHaveURL(/search=E2E/);
    await expect.poll(projects).toEqual([ALPHA, BETA]);
    await al.searchProjectFilter.fill(BETA);
    await expect.poll(projects).toEqual([BETA]);
  });

  for (const [tc, field, value, expected, title] of [
    ["TC292", "Tag", "e2e-alloc", [BETA], "The Tag filter narrows the list"],
    [
      "TC293",
      "Project Manager",
      process.env.REP_MAN_NAME,
      [ALPHA],
      "The Project Manager filter narrows the list",
    ],
    [
      "TC294",
      "Project Type",
      "Retainer",
      [BETA],
      "The Project Type filter narrows the list",
    ],
  ]) {
    test(`${tc}: ${title}`, async () => {
      allure.story("Allocations");
      await al.goto("project", { search: SEARCH });
      await expect.poll(projects).toEqual([ALPHA, BETA]);
      await al.addFilterCondition(field, value);
      await expect.poll(projects).toEqual(expected);
    });
  }

  test("TC295: A search that matches no project shows the empty state", async () => {
    allure.story("Allocations");
    await al.goto("project", { search: "E2E Alloc no such project" });
    await expect(al.noData).toBeVisible();
    await expect(al.table).toHaveCount(0);
  });
});
