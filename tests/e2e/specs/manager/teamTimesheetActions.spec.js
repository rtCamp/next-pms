const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { reseedWeek, weekStatuses } from "../../helpers/weekTimeHelper";
import { TeamTimesheetPage } from "../../pageObjects/teamTimesheetPage";
import { TimesheetWeeksPage } from "../../pageObjects/timesheetWeeksPage";
import {
  cancelDocument,
  deleteDocument,
  getDocList,
} from "../../utils/api/apiClient";
import { dateInWeek, getFormattedDate, weekLabel } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";
import { scaleTimeout } from "../../utils/timeouts";

// TC232 seeds the members every case below acts on; see data/manager/teamTimesheet.js.
const FIXTURE = "TC232";
const LAST = weekLabel(1);
const ALPHA = "TM Alpha";
const ALPHA_TASK = "TM Alpha task";
const QUEUED = "Timesheet approval or rejection has been queued";
const lastWeek = (weekday) => dateInWeek(1, weekday);

// A Date range shows only that week, opened; the tab otherwise opens just its first four.
const onlyWeek = (weeksAgo) => ({
  compositeFilters: JSON.stringify([
    {
      id: "filter-1",
      field: "date",
      operator: "between",
      value: [dateInWeek(weeksAgo, "Mon"), dateInWeek(weeksAgo, "Sun")],
      fieldCategory: "",
    },
  ]),
});

// Every case here changes what it acts on; each brings its week back first when a retry
// finds it already changed, and removes what it adds.
test.describe("Manager: Team timesheet actions", () => {
  /** @type {TeamTimesheetPage} */ let team;
  let data;
  let member;

  test.beforeEach(async ({ page, jsonDir }) => {
    team = new TeamTimesheetPage(page);
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
    member = Object.fromEntries(
      Object.entries(data.employees).map(([key, { name }]) => [key, name]),
    );
  });

  /** Puts a seeded week back when it no longer reads `status` on every timesheet. */
  const ensureWeek = async (who, weeksAgo, status) => {
    const statuses = await weekStatuses(data, who, weeksAgo);
    if (!statuses.length || statuses.some((s) => s !== status)) {
      await reseedWeek(data, FIXTURE, who, weeksAgo);
    }
  };

  /** Deletes an employee's timesheets on a date. */
  const clearDay = async (employee, date) => {
    for (const { name, docstatus } of await getDocList(
      "Timesheet",
      [
        ["employee", "=", employee],
        ["start_date", "=", date],
      ],
      { fields: ["name", "docstatus"] },
    )) {
      if (docstatus === 1) await cancelDocument("Timesheet", name);
      await deleteDocument("Timesheet", name);
    }
  };

  /** A member's status once the page is fetched afresh, for decisions made by a queued job. */
  const statusAfterReload = async (label, who) => {
    await team.reload();
    return team.memberStatus(label, who);
  };

  /** A browser of the employee EMP, next to the manager's. */
  const employeePage = async (browser) => {
    const context = await browser.newContext({
      baseURL: process.env.BASE_URL,
      storageState: path.resolve(__dirname, "../../auth/employee.json"),
    });
    return { context, page: await context.newPage() };
  };

  test("TC246: The manager adds time for a member from the Team tab", async () => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    const employee = data.employees.TmAddTime.id;
    const wednesday = lastWeek("Wed");
    await clearDay(employee, wednesday);
    try {
      await team.goto({ search: member.TmAddTime });
      await team.addTimeButton.click();
      await team.fillAddTime({
        employee: member.TmAddTime,
        project: ALPHA,
        task: ALPHA_TASK,
        date: wednesday,
        duration: "02:00",
        comment: "TC246 - added by the manager",
      });
      await team.addTimeDialog
        .getByRole("button", { name: "Save and close" })
        .click();
      await expect(
        team.toast("Time Entry submitted successfully"),
      ).toBeVisible();
      await expect(team.addTimeDialog).toBeHidden();

      await team.reload();
      await expect(
        team.cells(team.memberRow(LAST, member.TmAddTime)).nth(2),
      ).toHaveText("02:00");
    } finally {
      await clearDay(employee, wednesday);
    }
  });

  test("TC247: Save and add another keeps the member and date and clears the entry; Save and close closes the dialog", async () => {
    allure.story("Team Timesheet");
    test.setTimeout(scaleTimeout(80000));
    const employee = data.employees.TmAddTime.id;
    const thursday = lastWeek("Thu");
    await clearDay(employee, thursday);
    try {
      await team.goto({ search: member.TmAddTime });
      await team.addTimeButton.click();
      await team.fillAddTime({
        employee: member.TmAddTime,
        project: ALPHA,
        task: ALPHA_TASK,
        date: thursday,
        duration: "01:00",
        comment: "TC247 - first entry",
      });
      const dialog = team.addTimeDialog;
      await dialog
        .getByRole("button", { name: "Save and add another" })
        .click();
      await expect(team.toast("Time Entry submitted successfully")).toBeVisible(
        {
          timeout: scaleTimeout(15000),
        },
      );

      // Still open on the same member and day, with the entry itself cleared.
      await expect(dialog).toBeVisible();
      await expect(dialog.getByPlaceholder("Select employee")).toHaveValue(
        member.TmAddTime,
      );
      await expect(
        dialog.getByRole("textbox", { name: "Date (required)" }),
      ).toHaveValue(thursday);
      await expect(dialog.getByPlaceholder("Select project")).toHaveValue("");
      await expect(dialog.getByPlaceholder("Select task")).toHaveValue("");
      await expect(dialog.getByPlaceholder("00:00")).toHaveValue("00:00");
      await expect(dialog.locator("[contenteditable]").first()).toHaveText("");

      await team.choose("Select project", ALPHA);
      await team.choose("Select task", ALPHA_TASK);
      await dialog.getByPlaceholder("00:00").fill("02:00");
      await dialog
        .locator("[contenteditable]")
        .first()
        .fill("TC247 - second entry");
      await dialog.getByRole("button", { name: "Save and close" }).click();
      await expect(dialog).toBeHidden({ timeout: scaleTimeout(15000) });

      await team.reload();
      await expect(
        team.cells(team.memberRow(LAST, member.TmAddTime)).nth(3),
      ).toHaveText("03:00");
    } finally {
      await clearDay(employee, thursday);
    }
  });

  test("TC249: The manager adds time-off for a member from the Team tab", async () => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    const reason = "TC249 - full day off";
    // TmTimeOff's holiday list has no days off, so today is always a working day.
    const today = getFormattedDate(new Date());
    const todayIndex = (new Date().getDay() + 6) % 7;
    const leaves = () =>
      getDocList(
        "Leave Application",
        [
          ["employee", "=", data.employees.TmTimeOff.id],
          ["description", "=", reason],
        ],
        { fields: ["name"] },
      );
    const clear = async () => {
      for (const { name } of await leaves()) {
        await deleteDocument("Leave Application", name);
      }
    };

    await clear();
    try {
      await team.goto({ search: member.TmTimeOff });
      await team.addTimeOffButton.click();
      await team.addTimeOffDialog.waitFor();
      await team.fillTimeOff({
        employee: member.TmTimeOff,
        from: today,
        duration: "Full Day",
        type: "Unpaid Time Off",
        reason,
      });
      await team.saveTimeOff();
      await expect(team.toast("Leave created successfully")).toBeVisible();

      await team.reload();
      await team.expandMember("This week", member.TmTimeOff);
      const days = await team.rowDays(
        team.detailRow("This week", member.TmTimeOff, "Time-off"),
      );
      expect(days[todayIndex]).toBe("08:00");
    } finally {
      await clear();
    }
  });

  test("TC255: Approving a submitted week from the Team tab approves it and locks its days", async () => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    await ensureWeek("TmApprove", 1, "Approval Pending");
    await team.goto({ search: member.TmApprove });
    await team.approve(LAST, member.TmApprove);
    await expect(team.toast(QUEUED)).toBeVisible();

    await expect
      .poll(() => statusAfterReload(LAST, member.TmApprove), {
        timeout: scaleTimeout(40000),
        intervals: [3000],
      })
      .toBe("Approved");
    const cells = team.cells(team.memberRow(LAST, member.TmApprove));
    for (const index of [0, 1, 2, 3, 4]) {
      await expect(cells.nth(index)).toBeDisabled();
    }
  });

  test("TC256: Approving only the ticked day leaves the rest of the week to decide", async () => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    await ensureWeek("TmOneDay", 1, "Approval Pending");
    await team.goto({ search: member.TmOneDay });
    await team.openDrawer(LAST, member.TmOneDay);
    for (const weekday of ["Tue", "Wed", "Thu", "Fri"]) {
      await team.dayCheckbox(lastWeek(weekday)).click();
    }
    await team.approveButton.click();
    await expect(team.toast(QUEUED)).toBeVisible();

    await expect
      .poll(() => statusAfterReload(LAST, member.TmOneDay), {
        timeout: scaleTimeout(40000),
        intervals: [3000],
      })
      .toBe("Partially approved");
    await team.openDrawer(LAST, member.TmOneDay);
    await expect(team.dayCheckbox(lastWeek("Mon"))).toBeDisabled();
    await expect(team.dayCheckbox(lastWeek("Tue"))).toBeChecked();
    await expect(team.approveButton).toBeEnabled();
  });

  test("TC257: A manager cannot approve their own week", async () => {
    allure.story("Team Timesheet");
    const own = process.env.REP_MAN_NAME;
    const week = weekLabel(2);
    await team.goto({ search: own });
    await team.approve(week, own);
    await expect(
      team.toast("You cannot approve or reject your own timesheets."),
    ).toBeVisible();
    // Refused before anything is written.
    await expect(team.drawer).toBeVisible();
    expect(await weekStatuses(data, "MANAGER", 2)).not.toContain("Approved");
    await team.reload();
    expect(await team.memberStatus(week, own)).toBe("Approval pending");
  });

  test("TC258: Approving a week older than the backdate limit is refused with the earliest allowed date", async () => {
    allure.story("Team Timesheet");
    const weeksAgo = data.resolvedWeeks.TmOld;
    expect(
      weeksAgo,
      "the seed found the manager's backdate limit",
    ).toBeTruthy();
    const week = weekLabel(weeksAgo);
    await team.goto({ search: member.TmOld, ...onlyWeek(weeksAgo) });
    await team.approve(week, member.TmOld);
    await expect(
      team.toast(
        /Backdated time entries are not allowed\. The earliest date you can log time for is/,
      ),
    ).toBeVisible();
    expect(await weekStatuses(data, "TmOld", weeksAgo)).toEqual([
      "Approval Pending",
    ]);
  });

  test("TC259: An approval is queued, and the member's row shows the new status once it is processed", async () => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    await ensureWeek("TmQueued", 1, "Approval Pending");
    await team.goto({ search: member.TmQueued });
    await team.approve(LAST, member.TmQueued);
    await expect(team.toast(QUEUED)).toBeVisible();
    await expect
      .poll(() => statusAfterReload(LAST, member.TmQueued), {
        timeout: scaleTimeout(40000),
        intervals: [3000],
      })
      .toBe("Approved");
  });

  test("TC260: Once a week is approved its drawer cannot decide it again, even while the job runs", async () => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    await ensureWeek("TmLocked", 1, "Approval Pending");
    await team.goto({ search: member.TmLocked });
    await team.approve(LAST, member.TmLocked);
    await expect(team.toast(QUEUED)).toBeVisible();
    await expect(team.drawer).toBeHidden();

    // Processing and approved days both count as decided, so the drawer opens read-only.
    await team.openDrawer(LAST, member.TmLocked);
    await expect(team.approveButton).toBeDisabled();
    await expect(team.rejectButton).toBeDisabled();
  });

  test("TC263: A week rejected from the Team tab shows the reason to the employee", async ({
    browser,
  }) => {
    allure.story("Team Timesheet");
    test.setTimeout(240000);
    const reason = "TC263 - please split Monday's entry by task";
    const week = weekLabel(4);
    const employeeName = process.env.EMP_NAME;
    await ensureWeek("EMP", 4, "Approval Pending");

    await team.goto({ search: employeeName, ...onlyWeek(4) });
    await team.reject(week, employeeName, reason);
    await expect(team.toast(QUEUED)).toBeVisible();
    await expect
      .poll(() => statusAfterReload(week, employeeName), {
        timeout: scaleTimeout(40000),
        intervals: [3000],
      })
      .toMatch(/rejected/i);

    const { context, page } = await employeePage(browser);
    try {
      const weeks = new TimesheetWeeksPage(page);
      await weeks.goto(onlyWeek(4));
      await weeks.expandWeek(week);
      expect(await weeks.weekStatus(week)).toMatch(/rejected/i);
      await weeks.cells(weeks.row(week, ALPHA_TASK)).nth(0).click();
      const popover = page.getByRole("dialog").last();
      await expect(popover.getByText("Rejection reason")).toBeVisible();
      await expect(popover).toContainText(reason);
    } finally {
      await context.close();
    }
  });

  test("TC264: An employee submits a week, the manager approves it, and the employee's week reads Approved and is locked", async ({
    browser,
  }) => {
    allure.story("Team Timesheet");
    test.setTimeout(300000);
    const employeeName = process.env.EMP_NAME;
    await ensureWeek("EMP", 1, "Not Submitted");

    const { context, page } = await employeePage(browser);
    try {
      const weeks = new TimesheetWeeksPage(page);
      await weeks.goto();
      await weeks.expandWeek(LAST);
      await weeks.submitWeek(LAST, process.env.REP_MAN_NAME);
      await expect(weeks.submitDialog).toBeHidden();
      await expect
        .poll(
          async () => {
            await weeks.reload(LAST);
            return weeks.weekStatus(LAST);
          },
          { timeout: scaleTimeout(40000), intervals: [3000] },
        )
        .toBe("Approval pending");

      await team.goto({ search: employeeName });
      await team.approve(LAST, employeeName);
      await expect(team.toast(QUEUED)).toBeVisible();
      await expect
        .poll(() => statusAfterReload(LAST, employeeName), {
          timeout: scaleTimeout(40000),
          intervals: [3000],
        })
        .toBe("Approved");

      await weeks.reload(LAST);
      expect(await weeks.weekStatus(LAST)).toBe("Approved");
      await expect(weeks.submitButton(LAST)).toHaveCount(0);
      const task = weeks.row(LAST, ALPHA_TASK);
      for (const index of [0, 1, 2, 3, 4]) {
        await expect(weeks.cells(task).nth(index)).toBeDisabled();
      }
    } finally {
      await context.close();
    }
  });
});
