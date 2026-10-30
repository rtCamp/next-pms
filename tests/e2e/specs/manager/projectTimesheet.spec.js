const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { ProjectTimesheetPage } from "../../pageObjects/projectTimesheetPage";
import { getDocList } from "../../utils/api/apiClient";
import { weekLabel } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";
import { findProjectId } from "../../utils/testCase";

// TC222 seeds the weeks every case below reads; see data/manager/projectTimesheet.js.
const FIXTURE = "TC222";
const [LAST, TWO, THREE] = [1, 2, 3].map(weekLabel);
const hoursOf = (text) => {
  const [hours, minutes] = text.split(":").map(Number);
  return hours + minutes / 60;
};

test.describe("Manager: Project timesheet", () => {
  /** @type {ProjectTimesheetPage} */ let projects;
  let data;
  let alpha;
  let beta;
  let task;
  let member;

  test.beforeEach(async ({ page, jsonDir }) => {
    projects = new ProjectTimesheetPage(page);
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
    alpha = data.payloadCreateProject.project_name;
    beta = data.payloadCreateProject2.project_name;
    task = data.payloadCreateWeekTime[0].subject;
    // The name each seeded member shows under a project.
    member = Object.fromEntries(
      Object.entries(data.employees).map(([key, { name }]) => [key, name]),
    );
  });

  test("TC222: The Project tab groups time by project, then member, then task", async () => {
    allure.story("Timesheet");
    await projects.goto({ search: FIXTURE });

    const alphaRow = projects.projectRow(LAST, alpha);
    await expect(alphaRow).toBeVisible();
    // Last week: the four members who logged time on it, under the project they booked against.
    const members = ["Draft", "Pending", "Approved", "Rejected"];
    for (const key of members) {
      await expect(projects.memberRow(LAST, alpha, member[key])).toBeVisible();
    }
    await expect(projects.memberRow(LAST, alpha, member.Split)).toHaveCount(0);
    await expect(projects.projectRow(LAST, beta)).toHaveCount(0);

    // The project's total adds up what its members show.
    let sum = 0;
    for (const key of members) {
      sum += hoursOf(
        await projects.rowTotal(projects.memberRow(LAST, alpha, member[key])),
      );
    }
    expect(hoursOf(await projects.rowTotal(alphaRow))).toBe(sum);

    // A member opens onto the task they logged it against.
    const pending = projects.memberRow(LAST, alpha, member.Pending);
    await projects.toggle(pending, member.Pending);
    const tasks = projects.memberPanel(LAST, alpha, member.Pending);
    await expect(tasks.getByText(task, { exact: true })).toBeVisible();
    await expect(projects.cells(tasks).first()).toHaveText("01:00");
  });

  test("TC223: Expanding a project reveals its members, and a member its tasks", async () => {
    allure.story("Timesheet");
    await projects.goto({ search: FIXTURE });
    const row = projects.projectRow(LAST, alpha);
    const pending = projects.memberRow(LAST, alpha, member.Pending);
    await expect(pending).toBeVisible();

    await projects.toggle(row, alpha);
    await expect(row).toHaveAttribute("aria-expanded", "false");
    await expect(pending).toHaveCount(0);

    await projects.toggle(row, alpha);
    await expect(pending).toBeVisible();
    // Members start closed.
    await expect(pending).toHaveAttribute("aria-expanded", "false");
    await expect(
      projects.memberPanel(LAST, alpha, member.Pending).getByText(task),
    ).toHaveCount(0);

    await projects.toggle(pending, member.Pending);
    await expect(pending).toHaveAttribute("aria-expanded", "true");
    await expect(
      projects.memberPanel(LAST, alpha, member.Pending).getByText(task),
    ).toBeVisible();
  });

  test("TC224: The Project tab lists weeks newest first, loads older ones on scroll, and says when a week has no timesheet", async ({
    page,
  }) => {
    allure.story("Timesheet");
    await projects.goto();

    for (const [index, pattern] of [
      /^This week/,
      /^Last week/,
      new RegExp(`^${TWO}`),
      new RegExp(`^${THREE}`),
    ].entries()) {
      await expect(projects.weekHeaders.nth(index)).toHaveText(pattern);
    }

    // Older weeks arrive as the list is scrolled to its end; the seeded time two months
    // past the first twelve is what there is to load.
    const loaded = await projects.weekHeaders.count();
    expect(loaded).toBeGreaterThan(4);
    await expect
      .poll(
        async () => {
          await page.mouse.move(700, 400);
          await page.mouse.wheel(0, 20000);
          return projects.weekHeader(weekLabel(14)).count();
        },
        { timeout: 60000, intervals: [1500] },
      )
      .toBe(1);
    expect(await projects.weekHeaders.count()).toBeGreaterThan(loaded);

    // A week nobody logged time in, found by a date range from long ago.
    await projects.goto({
      compositeFilters: JSON.stringify([
        {
          id: "filter-1",
          field: "date",
          operator: "between",
          value: ["2020-01-07", "2020-01-12"],
          fieldCategory: "",
        },
      ]),
    });
    await expect(projects.weekHeaders).toHaveCount(1);
    await expect(
      projects
        .weekRegion("Jan 6 - 12, 2020")
        .getByText("No timesheet for this week"),
    ).toBeVisible();
  });

  test("TC225: The filters on the Project tab narrow the weeks and rows by member and project", async () => {
    allure.story("Timesheet");

    await test.step("Member", async () => {
      await projects.goto({ search: FIXTURE });
      await projects.filterBy("Member", member.Pending);
      await expect(
        projects.memberRow(LAST, alpha, member.Pending),
      ).toBeVisible();
      await expect(projects.memberRow(LAST, alpha, member.Draft)).toHaveCount(
        0,
      );
    });

    await test.step("Project", async () => {
      await projects.goto({ search: FIXTURE });
      await projects.filterBy("Project", beta);
      await expect(projects.projectRow(TWO, beta)).toBeVisible();
      await expect(projects.projectRow(LAST, alpha)).toHaveCount(0);
    });

    await test.step("No Approval status filter", async () => {
      await expect(projects.approvalFilter).toHaveCount(0);
    });
  });

  test("TC226: Each member row shows the right approval badge", async () => {
    allure.story("Timesheet");
    await projects.goto({ search: FIXTURE });

    for (const [key, status] of [
      ["Draft", "Not submitted"],
      ["Pending", "Approval pending"],
      ["Approved", "Approved"],
      ["Rejected", "Rejected"],
    ]) {
      const row = projects.memberRow(LAST, alpha, member[key]);
      await expect(row).toContainText(status);
      if (key !== "Draft") {
        // A week still to submit has nothing to review, so no badge to open.
        await expect(projects.approvalBadge(row)).toHaveAttribute(
          "aria-label",
          status,
        );
      } else {
        await expect(projects.approvalBadge(row)).toHaveCount(0);
      }
    }
  });

  test("TC227: Approving a member's week from the Project tab decides only that project's entries", async ({}) => {
    allure.story("Timesheet");
    const employee = data.employees.Split.id;
    const alphaId = await findProjectId(data.payloadCreateProject);
    const betaId = await findProjectId(data.payloadCreateProject2);
    const statusesOn = async (project) => [
      ...new Set(
        (
          await getDocList(
            "Timesheet",
            [
              ["employee", "=", employee],
              ["parent_project", "=", project],
            ],
            { fields: ["custom_approval_status"] },
          )
        ).map((row) => row.custom_approval_status),
      ),
    ];

    // One week, two projects, all of it sent for approval.
    expect(await statusesOn(alphaId)).toEqual(["Approval Pending"]);
    expect(await statusesOn(betaId)).toEqual(["Approval Pending"]);

    await projects.goto({ search: FIXTURE });
    const row = projects.memberRow(TWO, alpha, member.Split);
    await projects.approvalBadge(row).click();
    await expect(projects.approvalDrawer).toContainText(member.Split);
    await expect(projects.approvalDrawer).toContainText(alpha);
    await expect(projects.approvalDrawer).not.toContainText(beta);
    await projects.approvalDrawer
      .getByRole("button", { name: "Approve" })
      .click();
    await expect(
      projects.toast("Timesheet approval or rejection has been queued"),
    ).toBeVisible();

    // The approval is queued, so give it a moment to land.
    await expect.poll(() => statusesOn(alphaId)).toEqual(["Approved"]);
    expect(await statusesOn(betaId)).toEqual(["Approval Pending"]);
  });
});
