const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { signedInContext } from "../../helpers/storageStateHelper";
import { reseedWeek } from "../../helpers/weekTimeHelper";
import { TeamTimesheetPage } from "../../pageObjects/teamTimesheetPage";
import { onlyWeek } from "../../pageObjects/timesheetTabPage";
import { TimesheetWeeksPage } from "../../pageObjects/timesheetWeeksPage";
import { getDocList } from "../../utils/api/apiClient";
import {
  createTimesheet,
  submitTimesheet,
} from "../../utils/api/timesheetRequests";
import { dateInWeek, weekLabel } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";
import { scaleTimeout } from "../../utils/timeouts";

// TC407 (data/manager/teamTimesheet.js) seeds a week past the backdate limit whose Monday
// was rejected today: Monday is open for its correction, Tuesday stays locked.
const FIXTURE = "TC407";
const WHO = "RwEmployee";
const TASK = "TM Reopen task";
const BACKDATED =
  /Backdated time entries are not allowed\. The earliest date you can log time for is/;
const QUEUED = "Timesheet approval or rejection has been queued";

// The cases share one week, and the last two change it.
test.describe.configure({ mode: "serial" });

test.describe("Timesheet: rejected-day correction window", () => {
  let data;
  let employee;
  let project;
  let weeksAgo;
  let week;
  let monday;
  let tuesday;

  test.beforeAll(async ({ jsonDir }) => {
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
    employee = data.employees[WHO];
    project = data.payloadCreateProject.project_name;
    weeksAgo = data.resolvedWeeks[WHO];
    week = weekLabel(weeksAgo);
    monday = dateInWeek(weeksAgo, "Mon");
    tuesday = dateInWeek(weeksAgo, "Tue");
  });

  /** The week's timesheets by day: { "<date>": { status, hours } }. */
  const weekState = async () =>
    Object.fromEntries(
      (
        await getDocList(
          "Timesheet",
          [
            ["employee", "=", employee.id],
            ["start_date", "between", [monday, dateInWeek(weeksAgo, "Sun")]],
            ["docstatus", "<", 2],
          ],
          { fields: ["start_date", "custom_approval_status", "total_hours"] },
        )
      ).map((row) => [
        row.start_date,
        { status: row.custom_approval_status, hours: row.total_hours },
      ]),
    );

  /** Puts the week back when an earlier attempt corrected or approved it. */
  const ensureSeeded = async () => {
    const days = await weekState();
    const seeded =
      Object.keys(days).length === 2 &&
      days[monday]?.status === "Rejected" &&
      days[monday]?.hours === 0 &&
      days[tuesday]?.status === "Approval Pending";
    if (!seeded) await reseedWeek(data, FIXTURE, WHO, weeksAgo);
  };

  test("TC407: The Team tab keeps a day rejected past the backdate limit open for review while the next old day stays locked", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    await ensureSeeded();
    const team = new TeamTimesheetPage(page);
    await team.goto({ search: employee.name, ...onlyWeek(weeksAgo) });
    await team.expandWeek(week);

    const days = team.cells(team.memberRow(week, employee.name));
    await expect(days.nth(0)).toBeEnabled();
    await expect(days.nth(1)).toBeDisabled();
  });

  test("TC408: The employee logs the correction on a day rejected past the backdate limit, and the next old day is still refused", async ({
    browser,
  }) => {
    allure.story("Timesheet");
    test.setTimeout(scaleTimeout(120000));
    await ensureSeeded();
    const context = await signedInContext(browser, employee.user, "rw-own");
    try {
      const weeks = new TimesheetWeeksPage(await context.newPage());
      await weeks.goto(onlyWeek(weeksAgo));
      await weeks.expandWeek(week);

      const days = weeks.cells(weeks.row(week, TASK));
      await expect(days.nth(0)).toBeEnabled();
      await expect(days.nth(1)).toBeDisabled();

      await weeks.addTime(week, 0, {
        project,
        task: TASK,
        duration: "01:00",
        comment: "TC408 - the corrected Monday",
      });
      await expect(weeks.addTimeDialog).toBeHidden();
      await expect.poll(async () => (await weekState())[monday]?.hours).toBe(1);

      await weeks.addTimeButton.click();
      await weeks.addTimeDialog.waitFor();
      await weeks.choose("Select project", project);
      await weeks.choose("Select task", TASK);
      await weeks.pickDate(weeks.dateField, tuesday);
      await weeks.addTimeDialog.getByPlaceholder("00:00").fill("01:00");
      await weeks.addTimeDialog
        .locator("[contenteditable]")
        .first()
        .fill("TC408 - Tuesday is past the limit");
      await weeks.addTimeDialog
        .getByRole("button", { name: "Save and close" })
        .click();
      await expect(weeks.addTimeDialog.getByText(BACKDATED)).toBeVisible();
      expect((await weekState())[tuesday].hours).toBe(1);
    } finally {
      await context.close();
    }
  });

  test("TC409: The manager approves the correction of a day rejected past the backdate limit, but not with the next old day ticked", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    test.setTimeout(scaleTimeout(120000));
    await ensureSeeded();
    // The employee's correction, sent for approval again.
    const [{ name: task }] = await getDocList("Task", [
      ["project", "=", data.payloadDeleteProject.projectId],
      ["subject", "=", TASK],
    ]);
    await createTimesheet(
      {
        task,
        description: "<p>TC409 - the corrected Monday</p>",
        hours: "1",
        date: monday,
        employee: employee.id,
      },
      "admin",
    );
    await submitTimesheet(
      {
        start_date: monday,
        end_date: dateInWeek(weeksAgo, "Sun"),
        notes: "TC409 - correction",
        approver: process.env.REP_MAN_ID,
        employee: employee.id,
      },
      "admin",
    );

    const team = new TeamTimesheetPage(page);
    await team.goto({ search: employee.name, ...onlyWeek(weeksAgo) });
    await team.expandWeek(week);
    await team.approve(week, employee.name);
    await expect(team.toast(BACKDATED)).toBeVisible();
    expect((await weekState())[monday].status).toBe("Approval Pending");

    await team.reload();
    await team.expandWeek(week);
    await team.openDrawer(week, employee.name);
    await team.dayCheckbox(tuesday).uncheck();
    await team.approveButton.click();
    await expect(team.toast(QUEUED)).toBeVisible();
    await expect
      .poll(async () => (await weekState())[monday]?.status, {
        timeout: scaleTimeout(40000),
        intervals: [3000],
      })
      .toBe("Approved");
    expect((await weekState())[tuesday].status).toBe("Approval Pending");
  });
});
