const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { AllocationsPage } from "../../pageObjects/resourceManagement/allocations";
import { allocationWeekLabel, dateInWeek } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";

// TC265 seeds the members and allocations every case reads; see data/manager/allocations.js.
const FIXTURE = "TC265";
const SEARCH = "Playwright- Al";
const ALLOCATE = "allocation.handle_allocation";

test.describe("Manager: Allocations team", () => {
  /** @type {AllocationsPage} */ let al;
  let data;
  let member;

  test.beforeEach(async ({ page, jsonDir }) => {
    al = new AllocationsPage(page);
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
    member = Object.fromEntries(
      Object.entries(data.employees).map(([key, { name }]) => [key, name]),
    );
  });

  /** The seeded members the grid shows, by their fixture keys. */
  const shown = async () => {
    const names = await al.rowNames();
    return Object.keys(member).filter((key) => names.includes(member[key]));
  };

  test("TC265: A member's hover card shows designation, department, weekly capacity and reporting manager, and links to the employee", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: member.AlDev });
    const card = await al.hoverCard(member.AlDev);
    await expect(card).toContainText("E2E Developer");
    await expect(card).toContainText("E2E Engineering");
    await expect(card).toContainText("40h/week");
    await expect(
      card.getByRole("link", { name: /Open employee/ }),
    ).toHaveAttribute(
      "href",
      new RegExp(`/employee/${data.employees.AlDev.id}$`),
    );

    await al.goto("team", { search: process.env.EMP3_NAME });
    await expect(await al.hoverCard(process.env.EMP3_NAME)).toContainText(
      process.env.REP_MAN_NAME,
    );
  });

  test("TC266: Duration switches the grid between this week, this month and this quarter", async ({
    page,
  }) => {
    allure.story("Allocations");
    await al.goto("team", { search: SEARCH });
    const thisWeek = allocationWeekLabel(0);

    await al.chooseDuration("This week");
    await expect(page).toHaveURL(/duration=this-week/);
    await expect(al.weekRangeSpans).toHaveText([thisWeek]);
    await expect(al.dayHeaderSpans).toHaveCount(7);

    await al.chooseDuration("This month");
    await expect(page).toHaveURL(/duration=this-month/);
    await expect(al.weekRangeSpans.first()).toHaveText(thisWeek);
    const monthWeeks = await al.weekRangeSpans.count();
    expect(monthWeeks).toBeGreaterThan(1);

    // This quarter is the default, so it leaves the URL.
    await al.chooseDuration("This quarter");
    await expect(page).not.toHaveURL(/duration=/);
    await expect(al.weekRangeSpans.first()).toHaveText(thisWeek);
    expect(await al.weekRangeSpans.count()).toBeGreaterThan(monthWeeks);
    // The seeded allocations, two weeks ahead, are inside the quarter.
    await expect(al.weekRangeSpans).toContainText([allocationWeekLabel(-2)]);
  });

  test("TC267: Previous, Today and Next move the grid by a week or a month, and Today returns", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: SEARCH, duration: "this-week" });
    await al.navButton("next", "week").click();
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(-1)]);
    await al.navButton("previous", "week").click();
    await al.navButton("previous", "week").click();
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(1)]);
    await al.todayButton.click();
    await expect(al.weekRangeSpans).toHaveText([allocationWeekLabel(0)]);

    await al.chooseDuration("This month");
    const thisMonth = await al.headerText();
    await al.navButton("next", "month").click();
    await expect.poll(() => al.headerText()).not.toBe(thisMonth);
    await al.navButton("previous", "month").click();
    await expect.poll(() => al.headerText()).toBe(thisMonth);
    await al.navButton("previous", "month").click();
    await expect.poll(() => al.headerText()).not.toBe(thisMonth);
    await al.todayButton.click();
    await expect.poll(() => al.headerText()).toBe(thisMonth);
  });

  test("TC268: The department filter narrows the members to that department", async ({
    page,
  }) => {
    allure.story("Allocations");
    await al.goto("team", { search: SEARCH });
    await al.pick(al.pickers.nth(1), ["E2E Quality"]);
    await expect(page).toHaveURL(/department=/);
    await expect.poll(shown).toEqual(["AlQa"]);
  });

  test("TC269: The designation filter narrows the members to that designation", async ({
    page,
  }) => {
    allure.story("Allocations");
    await al.goto("team", { search: SEARCH });
    await al.pick(al.pickers.nth(0), ["E2E Developer"]);
    await expect(page).toHaveURL(/designation=/);
    await expect.poll(shown).toEqual(["AlDev"]);
  });

  test("TC270: The Skill filter returns the members with that skill", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: SEARCH });
    await al.addFilterCondition("Skill", "E2E Playwright");
    await expect.poll(shown).toEqual(["AlDev"]);
  });

  test("TC271: Each allocation type keeps only the members with matching allocations", async () => {
    allure.story("Allocations");
    for (const [type, expected] of [
      ["Confirmed only", ["AlDelete", "AlDev", "AlDrag"]],
      ["Tentative only", ["AlQa"]],
      ["Billable only", ["AlDelete", "AlDev", "AlDrag"]],
      ["Non-billable only", ["AlQa"]],
    ]) {
      await al.goto("team", { search: SEARCH });
      await al.pick(al.pickers.last(), [type]);
      await expect
        .poll(async () => (await shown()).sort(), { message: type })
        .toEqual(expected);
    }
  });

  test("TC272: 'No allocation only' lists the members with no allocation and disables Confirmed only and Tentative only", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: SEARCH });
    await al.pick(al.pickers.last(), ["No allocation only"]);
    await expect.poll(shown).toEqual(["AlIdle"]);
    const options = await al.pickerOptions(al.pickers.last());
    expect(options).toContain("Confirmed only (disabled)");
    expect(options).toContain("Tentative only (disabled)");
    expect(options).toContain("Billable only");
  });

  test("TC273: Removing one filter condition leaves the other applied", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: SEARCH });
    await al.addFilterCondition("Skill", "E2E", false, "Like");
    await expect
      .poll(async () => (await shown()).sort())
      .toEqual(["AlDev", "AlQa"]);
    await al.addFilterCondition("Skill", "E2E Manual", true, "Not Equals");
    await expect.poll(shown).toEqual(["AlDev"]);

    await al.removeFilterButtons.last().click();
    await expect
      .poll(async () => (await shown()).sort())
      .toEqual(["AlDev", "AlQa"]);
  });

  test("TC274: Search, Duration, Allocation type and filter conditions survive a reload and a direct URL", async ({
    page,
  }) => {
    allure.story("Allocations");
    await al.goto("team");
    await al.searchEmployeeFilter.fill(SEARCH);
    await al.chooseDuration("This month");
    await al.pick(al.pickers.last(), ["Tentative only"]);
    await al.addFilterCondition("Skill", "E2E Manual");
    await expect.poll(shown).toEqual(["AlQa"]);
    const url = page.url();

    await page.reload();
    await expect.poll(shown).toEqual(["AlQa"]);
    await expect(al.searchEmployeeFilter).toHaveValue(SEARCH);
    await expect(al.durationSelect).toHaveText("This month");
    await expect(al.pickers.last()).toHaveText("Tentative only");

    // Opened from a blank tab, the URL alone carries the state.
    const fresh = new AllocationsPage(await page.context().newPage());
    try {
      await fresh.page.goto(url);
      await expect.poll(() => fresh.rowNames()).toEqual([member.AlQa]);
      await expect(fresh.pickers.last()).toHaveText("Tentative only");
    } finally {
      await fresh.page.close();
    }
  });

  test("TC275: Allocate with Employee, Project and Hours / day empty shows the required messages and creates nothing", async ({
    page,
  }) => {
    allure.story("Allocations");
    const posted = [];
    page.on("request", (req) => {
      if (req.url().includes(ALLOCATE)) posted.push(req.url());
    });
    await al.goto("team", { search: SEARCH });
    await al.addAllocatioButtton.first().click();
    await al.allocate();
    await expect(al.message("Please select an employee.")).toBeVisible();
    await expect(al.message("Please select a project.")).toBeVisible();
    await expect(al.message("Must be greater than 0.")).toBeVisible();
    await expect(al.dialog).toBeVisible();
    expect(posted).toEqual([]);
  });

  test("TC280: An allocation's chip and popover show its project, dates, hours and billable state", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: member.AlDev });
    await expect(al.chips(member.AlDev)).toHaveText(["4h free"]);
    const popover = await al.openChip(member.AlDev);
    await expect(popover).toContainText("E2E Alloc Alpha");
    await expect(popover).toContainText(
      `${AllocationsPage.day(dateInWeek(-2, "Mon"))} – ${AllocationsPage.day(dateInWeek(-2, "Fri"))}`,
    );
    await expect(popover).toContainText("4h/day (20 hours)");
    await expect(popover).toContainText(/Confirmed\s*·\s*Billable/);
  });

  test("TC281: Tentative and Confirmed allocations are shown differently", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: SEARCH });
    await expect(await al.openChip(member.AlQa)).toContainText(
      /Tentative\s*·\s*Non-billable/,
    );
    await al.page.keyboard.press("Escape");
    await expect(await al.openChip(member.AlDev)).toContainText(
      /Confirmed\s*·\s*Billable/,
    );
    await al.page.keyboard.press("Escape");

    await al.expandRow(member.AlDev);
    await al.expandRow(member.AlQa);
    const confirmed = al.allocationBar("E2E Alloc Alpha");
    const tentative = al.allocationBar("E2E Alloc Beta");
    // A tentative bar is hatched; a confirmed one is plain.
    await expect(al.hatch(tentative)).toHaveCount(1);
    await expect(al.hatch(confirmed)).toHaveCount(0);
  });

  test("TC282: Edit allocation opens with the allocation's values filled in", async ({
    page,
  }) => {
    allure.story("Allocations");
    const posted = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("allocation."))
        posted.push(req.url());
    });
    await al.goto("team", { search: member.AlDev });
    await (
      await al.openChip(member.AlDev)
    )
      .getByRole("button", { name: "Edit allocation" })
      .click();
    await expect(al.dialog.locator("#employee")).toHaveValue(member.AlDev);
    await expect(al.dialog.locator("#project")).toHaveValue("E2E Alloc Alpha");
    await expect(al.dateRangeInput).toHaveValue(
      `${AllocationsPage.day(dateInWeek(-2, "Mon"))} - ${AllocationsPage.day(dateInWeek(-2, "Fri"))}`,
    );
    await expect(al.dialog.locator("#hours-per-day")).toHaveValue("04:00");
    await expect(al.totalHoursTextField).toHaveValue("20");
    await expect(al.noteField).toHaveValue("TC265 seeded allocation");
    await expect(al.nonBillableCheckbox).not.toBeChecked();
    await expect(al.tentativeCheckbox).not.toBeChecked();

    await al.dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(al.dialog).toBeHidden();
    expect(posted).toEqual([]);
  });
});
