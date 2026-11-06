const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { DashboardPage } from "../../pageObjects/dashboardPage";
import { ProjectsListPage } from "../../pageObjects/projectsListPage";
import {
  getDocList,
  getDocument,
  updateDocument,
} from "../../utils/api/apiClient";
import { dateInWeek, mondayWeeksAgo } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";

// TC359 seeds the group's data (data/manager/dashboard.js). Most widgets are cached on the
// server for hours, so a case compares the widget with the answer the page loaded, and the
// seed keeps every list non-empty on a fresh site.
const FIXTURE = "TC359";
const PREFIX = "E2E Db";
const FIRST_NAME = process.env.REP_MAN_NAME.split(" ")[0];
// The milestones sit 26 weeks ahead, the 14th two-week window of the calendar.
const CALENDAR_WEEK = -26;

/** How the dashboard prints numbers: up to two decimals, nothing for a blank. */
const number = (value) => {
  const n = Number(value);
  return value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(n)
    ? "0"
    : `${Number(n.toFixed(2))}`;
};
const hours = (value) => `${number(value)}h`;
const usd = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
const short = (date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
/** The calendar's label for a 14-day window starting on `monday`: "Oct 26 – Nov 8, 2026". */
const rangeLabel = (monday) => {
  const end = new Date(monday);
  end.setDate(end.getDate() + 13);
  return `${short(monday)} – ${short(end)}, ${end.getFullYear()}`;
};
const monthsAgo = (count) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - count);
  return date;
};
const monthLabel = (date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

test.describe("Manager: Dashboards", () => {
  /** @type {DashboardPage} */ let dashboard;
  let data;

  test.beforeEach(async ({ page, jsonDir }) => {
    dashboard = new DashboardPage(page);
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
  });

  test("TC359: The Manager and Leadership dashboards each show their own widgets under their own heading", async () => {
    allure.story("Dashboard");
    await dashboard.goto("manager");
    await expect(dashboard.breadcrumbs).toHaveText(["Dashboard", "Management"]);
    await expect(dashboard.greeting).toHaveText(`Hey, ${FIRST_NAME}`);
    for (const label of [
      "At risk projects",
      "Members without allocation",
      "Timesheets to review",
      "Outstanding timesheets",
    ]) {
      await expect(dashboard.statCard(label), label).toBeVisible();
    }
    for (const heading of [
      "Heatmap",
      "Notifications",
      "Managed projects",
      "Timesheets",
      "Upcoming time-offs",
    ]) {
      await expect(dashboard.heading(heading), heading).toBeVisible();
    }
    await expect(dashboard.rangeButton).toBeVisible();
    await expect(
      dashboard.page.getByText("Revenue", { exact: true }),
    ).toHaveCount(0);

    await dashboard.goto("leadership");
    await expect(dashboard.breadcrumbs).toHaveText(["Dashboard", "Leadership"]);
    await expect(dashboard.greeting).toHaveText(`Hey, ${FIRST_NAME}`);
    for (const label of [
      "Revenue",
      "Cost",
      "Profit margin",
      "Active billable projects",
      "At risk projects",
      "Members without allocation",
      "Non-billable hours logged",
    ]) {
      await expect(dashboard.statCard(label), label).toBeVisible();
    }
    for (const heading of [
      "Heatmap",
      "Notifications",
      "Utilised time in the past 30 days",
      "Forecast breakdown for the next month",
    ]) {
      await expect(dashboard.heading(heading), heading).toBeVisible();
    }
    await expect(dashboard.rangeButton).toBeVisible();
    await expect(dashboard.heading("Managed projects")).toHaveCount(0);
    await expect(dashboard.heading("Upcoming time-offs")).toHaveCount(0);
  });

  test("TC360: At risk projects counts the Red and Amber projects and opens the Projects list filtered to them", async ({
    page,
  }) => {
    allure.story("Dashboard");
    // Staging's rtcamp app recalculates a project's colour when its milestones change, so
    // put the seeded colours back, then expect what the projects hold right now.
    const seeded = [
      [data.payloadDeleteProject.projectId, "Red"],
      [data.payloadDeleteProject2.projectId, "Amber"],
    ];
    for (const [id, rag] of seeded) {
      await updateDocument("Project", id, { custom_project_rag_status: rag });
    }
    const atRisk = await getDocList("Project", [
      ["is_active", "=", "Yes"],
      ["custom_project_rag_status", "in", ["Red", "Amber"]],
    ]);
    const { get_at_risk_projects_count: count } = await dashboard.goto(
      "manager",
      ["get_at_risk_projects_count"],
    );
    // Counted live, not cached: the card shows the projects that are Red or Amber now.
    expect(count).toBe(atRisk.length);
    await expect
      .poll(() => dashboard.statValue("At risk projects"))
      .toBe(number(count));

    await dashboard.statLink("At risk projects").click();
    // The app re-encodes the link (%2C) and adds view=; read the filters, not the string.
    await expect(page).toHaveURL(/\/next-pms\/projects\?/);
    const query = new URL(page.url()).searchParams;
    expect(query.get("status")).toBe("Open");
    expect(JSON.parse(query.get("rag"))).toEqual(["red", "amber"]);
    // The link keeps the manager's last Projects view (the Kanban cases leave Kanban),
    // so read its filters in the list view.
    const projects = new ProjectsListPage(page);
    await projects.open({
      ...Object.fromEntries(new URL(page.url()).searchParams),
      search: PREFIX,
    });
    const colours = Object.fromEntries(
      await Promise.all(
        seeded.map(async ([id]) => {
          const doc = await getDocument("Project", id);
          return [doc.project_name, doc.custom_project_rag_status];
        }),
      ),
    );
    const expected = Object.keys(colours)
      .filter((name) => ["Red", "Amber"].includes(colours[name]))
      .sort();
    expect(expected, JSON.stringify(colours)).toHaveLength(2);
    await expect.poll(() => projects.names()).toEqual(expected);
  });

  test("TC361: Timesheets to review counts the direct reports' timesheets awaiting approval this week", async () => {
    allure.story("Dashboard");
    const { get_timesheets_to_review: pending } = await dashboard.goto(
      "manager",
      ["get_timesheets_to_review"],
    );
    // The seeded report submitted Monday's time this week.
    expect(
      pending.filter((ts) => ts.employee === data.employees.DbOpen.id),
    ).toEqual([
      expect.objectContaining({ custom_approval_status: "Approval Pending" }),
    ]);
    await expect
      .poll(() => dashboard.statValue("Timesheets to review"))
      .toBe(number(pending.length));
  });

  test("TC362: The Heatmap shows a row of 16 weekly cells per selected role, and its role filter changes the rows", async () => {
    allure.story("Dashboard");
    const { get_allocation_heatmap: heatmap } = await dashboard.goto(
      "manager",
      ["get_allocation_heatmap"],
    );
    const picker = dashboard.sectionPicker("Heatmap");
    const selected = await dashboard.selectedOptions(picker);
    const shown = heatmap.roles
      .map((role) => role.designation)
      .filter((role) => selected.includes(role));
    expect(shown.length, "some roles are selected").toBeGreaterThan(0);
    await expect.poll(() => dashboard.heatmapRoles()).toEqual(shown);

    const [first] = heatmap.roles.filter((r) => r.designation === shown[0]);
    const state = ({ capacity_hours: cap, allocated_hours: alloc }) =>
      cap <= 0 || alloc <= 0 ? "none" : alloc >= cap ? "full" : "partial";
    expect(await dashboard.heatmapCells(first.designation)).toEqual(
      first.weeks.map(
        (week) =>
          `${first.designation} week of ${week.week_start}: ${state(week)}`,
      ),
    );
    expect(first.weeks).toHaveLength(16);
    for (const legend of [
      "Fully allocated",
      "Partial allocation",
      "No allocation",
    ]) {
      await expect(
        dashboard.section("Heatmap").getByText(legend, { exact: true }),
      ).toBeVisible();
    }

    // Untick one shown role and tick one that is not shown.
    const hidden = heatmap.roles
      .map((role) => role.designation)
      .find((role) => !selected.includes(role));
    await dashboard.toggle(picker, [shown[0], ...(hidden ? [hidden] : [])]);
    const expected = heatmap.roles
      .map((role) => role.designation)
      .filter(
        (role) =>
          (selected.includes(role) && role !== shown[0]) || role === hidden,
      );
    await expect.poll(() => dashboard.heatmapRoles()).toEqual(expected);
    await expect(picker).toHaveText(
      expected.length === heatmap.roles.length
        ? "All roles"
        : `${expected.length} role${expected.length === 1 ? "" : "s"} selected`,
    );
  });

  test("TC363: An unread notification shows on the card, opens its link and leaves the card, and See all opens the tray", async ({
    page,
  }) => {
    allure.story("Dashboard");
    const name = data.docs.notification;
    const { title, url } = await getDocument("NextPMS Notifications", name);
    const stays = await getDocument(
      "NextPMS Notifications",
      data.docs.notification2,
    );
    // A retry finds the first attempt's click already marked it read.
    await updateDocument("NextPMS Notifications", name, { viewed: 0 });
    await updateDocument("NextPMS Notifications", stays.name, { viewed: 0 });

    await dashboard.goto("manager");
    await expect(dashboard.notification(title)).toBeVisible();
    await dashboard.notification(title).click();
    await expect(page).toHaveURL(new RegExp(`${url}$`));
    await expect
      .poll(
        async () => (await getDocument("NextPMS Notifications", name)).viewed,
      )
      .toBe(1);

    await dashboard.goto("manager");
    await expect(dashboard.heading("Notifications")).toBeVisible();
    await expect(dashboard.notification(title)).toHaveCount(0);
    await expect(dashboard.notification(stays.title)).toBeVisible();
    // The tray lists the same unread notifications as the card.
    const targets = (links) =>
      links.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    const unread = await targets(
      dashboard.section("Notifications").getByRole("link"),
    );
    expect(unread.length).toBeGreaterThan(0);
    await dashboard.seeAll.click();
    await expect(dashboard.tray).toBeVisible();
    await expect(
      dashboard.tray.getByRole("link", {
        name: new RegExp(`^${stays.title}`),
      }),
    ).toBeVisible();
    await expect
      .poll(() => targets(dashboard.tray.getByRole("link")))
      .toEqual(unread);
  });

  test("TC364: Previous range, Today and Next range move the calendar by 14 days, and the date picker jumps to the chosen week", async () => {
    allure.story("Dashboard");
    await dashboard.goto("manager");
    const monday = mondayWeeksAgo(0);
    const shifted = (days) => {
      const date = new Date(monday);
      date.setDate(date.getDate() + days);
      return date;
    };
    await expect(dashboard.rangeButton).toHaveText(rangeLabel(monday));
    await dashboard.nextRange.click();
    await expect(dashboard.rangeButton).toHaveText(rangeLabel(shifted(14)));
    await dashboard.previousRange.click();
    await dashboard.previousRange.click();
    await expect(dashboard.rangeButton).toHaveText(rangeLabel(shifted(-14)));
    await dashboard.todayButton.click();
    await expect(dashboard.rangeButton).toHaveText(rangeLabel(monday));

    await dashboard.pickCalendarDate(dateInWeek(-6, "Thu"));
    await expect(dashboard.rangeButton).toHaveText(
      rangeLabel(mondayWeeksAgo(-6)),
    );
  });

  test("TC365: The calendar's project filter narrows its items to the chosen projects", async () => {
    allure.story("Dashboard");
    await dashboard.goto("manager");
    const items = dashboard.response(
      "get_calendar_timeline_items",
      (url) =>
        url.searchParams.get("from_date") === dateInWeek(CALENDAR_WEEK, "Mon"),
    );
    await dashboard.pickCalendarDate(dateInWeek(CALENDAR_WEEK, "Wed"));
    await items;
    const red = dashboard.calendarItem(`${PREFIX} milestone Red`);
    const amber = dashboard.calendarItem(`${PREFIX} milestone Amber`);
    await expect(red).toBeVisible();
    await expect(amber).toBeVisible();
    await expect(dashboard.calendarPicker).toHaveText("All projects");

    await dashboard.toggle(dashboard.calendarPicker, [`${PREFIX} Red`]);
    await expect(dashboard.calendarPicker).toHaveText("1 project selected");
    await expect(red).toBeVisible();
    await expect(amber).toHaveCount(0);
  });

  test("TC366: Managed projects lists the manager's open projects with Remaining and last week's hours", async () => {
    allure.story("Dashboard");
    const { get_my_projects_summary: projects } = await dashboard.goto(
      "manager",
      ["get_my_projects_summary"],
    );
    expect(projects.length, "the seeded projects are managed").toBeGreaterThan(
      0,
    );
    await expect
      .poll(() => dashboard.listNames("Managed projects"))
      .toEqual(projects.map((p) => p.project_name));
    const [first] = projects;
    expect(
      await dashboard.listRowValues("Managed projects", first.project_name),
    ).toEqual([
      hours(first.total_hours_remaining),
      hours(first.billable_hours),
      hours(first.non_billable_hours),
    ]);
  });

  test("TC367: The Managed projects customer filter narrows the list to the chosen customer", async () => {
    allure.story("Dashboard");
    const { get_my_projects_summary: projects } = await dashboard.goto(
      "manager",
      ["get_my_projects_summary"],
    );
    const customer = projects.find((p) => p.customer)?.customer;
    expect(customer, "a managed project has a customer").toBeTruthy();
    const picker = dashboard.sectionPicker("Managed projects");
    await expect(picker).toHaveText("All customers");
    await dashboard.toggle(picker, [customer]);
    const customers = new Set(projects.map((p) => p.customer).filter(Boolean));
    await expect(picker).toHaveText(
      customers.size === 1 ? "All customers" : "1 customer selected",
    );
    await expect
      .poll(() => dashboard.listNames("Managed projects"))
      .toEqual(
        projects
          .filter((p) => customers.size === 1 || p.customer === customer)
          .map((p) => p.project_name),
      );
  });

  test("TC368: The Timesheets panel lists each direct report's hours, expected hours and delta", async () => {
    allure.story("Dashboard");
    const { get_team_timesheets: rows } = await dashboard.goto("manager", [
      "get_team_timesheets",
    ]);
    expect(rows.length, "the manager has direct reports").toBeGreaterThan(0);
    await expect
      .poll(() => dashboard.listNames("Timesheets"))
      .toEqual(rows.map((r) => r.employee_name));
    for (const row of rows.slice(0, 3)) {
      expect(
        await dashboard.listRowValues("Timesheets", row.employee_name),
        row.employee_name,
      ).toEqual([
        hours(row.billable_hours),
        hours(row.non_billable_hours),
        hours(row.expected_hours),
        hours(row.delta),
      ]);
      expect(row.delta).toBeCloseTo(
        row.expected_hours - row.billable_hours - row.non_billable_hours,
        2,
      );
    }
  });

  test("TC369: Switching the Timesheets period to This week loads this week's rows and hours", async () => {
    allure.story("Dashboard");
    await dashboard.goto("manager", ["get_team_timesheets"]);
    await expect(dashboard.periodSelect).toHaveText("Last week");
    // This week asks for the days since Monday; on a Sunday that is the same 7 as Last week.
    const days = ((new Date().getDay() + 6) % 7) + 1;
    const next =
      days === 7
        ? null
        : dashboard.response(
            "get_team_timesheets",
            (url) => url.searchParams.get("days") === String(days),
          );
    await dashboard.choosePeriod("This week");
    await expect(dashboard.periodSelect).toHaveText("This week");
    if (next) {
      const rows = await next;
      await expect
        .poll(() => dashboard.listNames("Timesheets"))
        .toEqual(rows.map((r) => r.employee_name));
      const [first] = rows;
      expect(
        await dashboard.listRowValues("Timesheets", first.employee_name),
      ).toEqual([
        hours(first.billable_hours),
        hours(first.non_billable_hours),
        hours(first.expected_hours),
        hours(first.delta),
      ]);
    }
  });

  test("TC370: A member's name in the Timesheets panel opens Team timesheet filtered to that member", async ({
    page,
  }) => {
    allure.story("Dashboard");
    const { get_team_timesheets: rows } = await dashboard.goto("manager", [
      "get_team_timesheets",
    ]);
    const [member] = rows;
    await dashboard
      .section("Timesheets")
      .getByRole("link", { name: member.employee_name, exact: true })
      .click();
    await expect(page).toHaveURL(
      /\/next-pms\/timesheet\/team\?compositeFilters=/,
    );
    const filters = JSON.parse(
      new URL(page.url()).searchParams.get("compositeFilters"),
    );
    expect(filters).toEqual([
      expect.objectContaining({
        field: "employee",
        operator: "=",
        value: member.employee,
      }),
    ]);
  });

  test("TC376: Revenue, Cost and Profit margin share one month, and changing it on one card changes all three", async () => {
    allure.story("Dashboard");
    await dashboard.goto("leadership");
    const cards = ["Revenue", "Cost", "Profit margin"];
    for (const card of cards) {
      await expect(dashboard.kpiMonth(card), card).toHaveText(
        monthLabel(monthsAgo(1)),
      );
    }

    const month = monthsAgo(2);
    const first = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    const kpis = dashboard.response(
      "get_leadership_kpis",
      (url) => url.searchParams.get("cur_start") === first(month),
    );
    await dashboard.chooseKpiMonth(
      "Cost",
      month.toLocaleDateString("en-US", { month: "short" }),
      month.getFullYear(),
    );
    const { revenue, cost, profit_margin: margin } = await kpis;
    for (const card of cards) {
      await expect(dashboard.kpiMonth(card), card).toHaveText(
        monthLabel(month),
      );
    }
    await expect
      .poll(() => dashboard.kpiValue("Revenue"))
      .toBe(usd(revenue.current));
    await expect.poll(() => dashboard.kpiValue("Cost")).toBe(usd(cost.current));
    // This branch prints a zero margin as 0%; staging's build shows N/A.
    await expect
      .poll(() => dashboard.kpiValue("Profit margin"))
      .toMatch(
        new RegExp(
          `^(${number(margin.current)}%${margin.current ? "" : "|N/A"})$`,
        ),
      );
  });

  test("TC377: Active billable projects and Non-billable hours show the server's figures, and the project card opens the filtered list", async ({
    page,
  }) => {
    allure.story("Dashboard");
    const {
      get_active_projects_count: active,
      get_non_billable_hours: nonBillable,
    } = await dashboard.goto("leadership", [
      "get_active_projects_count",
      "get_non_billable_hours",
    ]);
    await expect
      .poll(() => dashboard.statValue("Active billable projects"))
      .toBe(number(active));
    await expect
      .poll(() => dashboard.statValue("Non-billable hours logged"))
      .toBe(number(nonBillable));

    await dashboard.statLink("Active billable projects").click();
    await expect(page).toHaveURL(/\/next-pms\/projects\?status=Open&advanced=/);
    const [condition] = JSON.parse(
      new URL(page.url()).searchParams.get("advanced"),
    );
    expect(condition).toEqual(
      expect.objectContaining({
        field: "custom_billing_type",
        operator: "!=",
        value: "Non-Billable",
      }),
    );
  });

  test("TC378: The dashboard keeps its role, project, customer and month choices after a reload", async () => {
    allure.story("Dashboard");
    test.slow();
    // Manager: heatmap roles, calendar projects and managed-project customers.
    const { get_my_projects_summary: projects } = await dashboard.goto(
      "manager",
      ["get_my_projects_summary"],
    );
    const heatmap = dashboard.sectionPicker("Heatmap");
    // Show exactly one role, the seeded one. Emptying the selection would not be kept: the
    // page puts its default roles back when none is saved.
    const role = `${PREFIX} Analyst`;
    const selected = await dashboard.selectedOptions(heatmap);
    await dashboard.toggle(heatmap, [
      ...selected.filter((name) => name !== role),
      ...(selected.includes(role) ? [] : [role]),
    ]);
    await expect(heatmap).toHaveText("1 role selected");
    await expect.poll(() => dashboard.heatmapRoles()).toEqual([role]);
    const heatmapText = await heatmap.innerText();
    const roles = await dashboard.heatmapRoles();

    const customer = projects.find((p) => p.customer)?.customer;
    const customers = dashboard.sectionPicker("Managed projects");
    await dashboard.toggle(customers, [customer]);
    const customersText = await customers.innerText();

    await dashboard.pickCalendarDate(dateInWeek(CALENDAR_WEEK, "Wed"));
    await dashboard.toggle(dashboard.calendarPicker, [`${PREFIX} Red`]);

    await dashboard.reload();
    await expect(heatmap).toHaveText(heatmapText);
    await expect.poll(() => dashboard.heatmapRoles()).toEqual(roles);
    await expect(customers).toHaveText(customersText);
    // The calendar's window is not kept, its project choice is.
    await dashboard.pickCalendarDate(dateInWeek(CALENDAR_WEEK, "Wed"));
    await expect(
      dashboard.calendarItem(`${PREFIX} milestone Red`),
    ).toBeVisible();
    await expect(
      dashboard.calendarItem(`${PREFIX} milestone Amber`),
    ).toHaveCount(0);

    // Leadership: utilised time and forecast roles, and the KPI month.
    await dashboard.goto("leadership");
    const utilisation = dashboard.sectionPicker(
      "Utilised time in the past 30 days",
    );
    const forecast = dashboard.sectionPicker(
      "Forecast breakdown for the next month",
    );
    await utilisation.click();
    const [firstRole] = await dashboard.page
      .getByRole("option")
      .allInnerTexts();
    await dashboard.page.keyboard.press("Escape");
    await dashboard.toggle(utilisation, [firstRole.trim()]);
    await dashboard.toggle(forecast, [firstRole.trim()]);
    const month = monthsAgo(3);
    await dashboard.chooseKpiMonth(
      "Revenue",
      month.toLocaleDateString("en-US", { month: "short" }),
      month.getFullYear(),
    );

    await dashboard.reload();
    await expect(utilisation).toHaveText("1 role selected");
    await expect(forecast).toHaveText("1 role selected");
    await expect(dashboard.kpiMonth("Revenue")).toHaveText(monthLabel(month));
  });
});
