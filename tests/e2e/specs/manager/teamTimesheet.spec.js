const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { TeamTimesheetPage } from "../../pageObjects/teamTimesheetPage";
import { dateInWeek, getFormattedDate, weekLabel } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";

// TC232 seeds the members every case below reads; see data/manager/teamTimesheet.js.
const FIXTURE = "TC232";
// Every seeded member's name starts with this, so it narrows the tab to them alone.
const SEARCH = "Playwright- Tm";
const LAST = weekLabel(1);
const ALPHA = "TM Alpha";
const ALPHA_TASK = "TM Alpha task";
const STATUSES = [
  "Not submitted",
  "Approved",
  "Rejected",
  "Approval pending",
  "Partially approved",
  "Partially rejected",
];
const lastWeek = (weekday) => dateInWeek(1, weekday);
const day = (offset) =>
  getFormattedDate(new Date(Date.now() + offset * 24 * 60 * 60 * 1000));

test.describe("Manager: Team timesheet", () => {
  /** @type {TeamTimesheetPage} */ let team;
  let member;

  test.beforeEach(async ({ page, jsonDir }) => {
    team = new TeamTimesheetPage(page);
    const data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[
      FIXTURE
    ];
    member = Object.fromEntries(
      Object.entries(data.employees).map(([key, { name }]) => [key, name]),
    );
  });

  test("TC231: The Timesheets breadcrumb menu switches between the Personal, Team and Project tabs", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    await team.goto();
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Team" })
      .click();
    await expect(team.breadcrumbOptions).toHaveText([
      "Personal",
      "Team",
      "Project",
    ]);
    await page.keyboard.press("Escape");

    await team.switchTab("Team", "Personal");
    await expect(page).toHaveURL(/\/next-pms\/timesheet(\?|$)/);
    await team.switchTab("Personal", "Project");
    await expect(page).toHaveURL(/\/next-pms\/timesheet\/project/);
    await team.switchTab("Project", "Team");
    await expect(page).toHaveURL(/\/next-pms\/timesheet\/team/);
  });

  test("TC232: Each week lists its members with their status, hours and total, and says how many are pending approval", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmPending });

    await expect(team.weekHeaders.first()).toHaveText(/^This week/);
    await expect(team.weekHeader(LAST)).toContainText("· 1 pending approval");
    await expect(team.weekHeader("This week")).not.toContainText("pending");

    const row = team.memberRow(LAST, member.TmPending);
    await expect(row).toContainText("Approval pending");
    expect(await team.rowDays(row)).toEqual([
      "01:00",
      "01:00",
      "01:00",
      "01:00",
      "01:00",
      "-",
      "-",
    ]);
    expect(await team.rowTotal(row)).toBe("05:00");
  });

  test("TC233: Scrolling to the end of the Team tab loads older weeks", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: SEARCH });
    // Twelve weeks come first; the member with time 14 weeks back means there are older ones.
    await expect(team.weekHeaders).toHaveCount(12);

    await expect
      .poll(
        async () => {
          await team.scrollGrid();
          return team.weekHeader(weekLabel(14)).count();
        },
        { timeout: 60000, intervals: [1500] },
      )
      .toBe(1);
    expect(await team.weekHeaders.count()).toBeGreaterThan(12);
  });

  test("TC234: A week with more than 20 members shows the first 20 and loads the rest on scroll", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: SEARCH });
    const rows = team.memberRows("This week", SEARCH);
    await expect(rows).toHaveCount(20);

    await expect
      .poll(
        async () => {
          await team.scrollToLastMember("This week", SEARCH);
          return rows.count();
        },
        { timeout: 60000, intervals: [1500] },
      )
      .toBeGreaterThan(20);
  });

  test("TC235: The Approval status dropdown lists six statuses and narrows the members and weeks to the chosen one", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    await team.goto({ search: SEARCH });

    await team.approvalFilter.click();
    await expect(page.getByRole("option")).toHaveText(STATUSES);
    await page.keyboard.press("Escape");

    await team.chooseApprovalStatus("Approval pending");
    await expect(page).toHaveURL(/approval=approval-pending/);
    await expect(team.memberRow(LAST, member.TmPending)).toBeVisible();
    await expect(team.memberRow(LAST, member.TmDraft)).toHaveCount(0);
    await expect(team.memberRow(LAST, member.TmApproved)).toHaveCount(0);
    // No seeded member has a pending week this week, so it drops out.
    await expect(team.weekHeader("This week")).toHaveCount(0);
  });

  test("TC236: Member, Project and Date filters together narrow the grid to that member's time on the project in the range", async () => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    await team.goto({ search: SEARCH });
    await team.filterBy("Member", member.TmDraft);
    await team.filterBy("Project", ALPHA);
    await team.filterByDate(lastWeek("Mon"), lastWeek("Sun"));

    const row = team.memberRow(LAST, member.TmDraft);
    await expect(row).toBeVisible();
    // Only the TM Alpha time counts: Monday to Wednesday, two hours a day.
    await expect.poll(() => team.rowTotal(row)).toBe("06:00");
    await expect(team.memberRow(LAST, member.TmPending)).toHaveCount(0);
    await expect(team.weekHeader("This week")).toHaveCount(0);
  });

  test("TC237: Removing one filter condition leaves the others applied", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    await team.goto({ search: SEARCH });
    await team.filterBy("Project", ALPHA);
    await team.filterBy("Member", member.TmDraft);
    await expect(team.memberRow(LAST, member.TmPending)).toHaveCount(0);

    await team.openFilterPanel();
    await page.getByRole("button", { name: "Remove filter" }).last().click();
    await team.closeFilterPanel();

    await expect(team.memberRow(LAST, member.TmPending)).toBeVisible();
    await expect(page).toHaveURL(/compositeFilters=.*project/);
    expect(decodeURIComponent(page.url())).not.toContain('"employee"');
    // The Project condition still applies: TmDraft's Beta hours stay out of the total.
    await expect
      .poll(() => team.rowTotal(team.memberRow(LAST, member.TmDraft)))
      .toBe("06:00");
  });

  test("TC238: A filter no member matches in any week shows ‘No data’", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: SEARCH });
    await team.filterBy("Project", "TM Empty");
    await expect(team.noData).toBeVisible();
    await expect(team.weekHeaders).toHaveCount(0);
  });

  test("TC239: Search, Approval status, Reports to and filter conditions stay applied after a reload and when the URL is opened directly", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    test.setTimeout(180000);
    await team.goto();
    await team.search(member.TmPending);
    await team.chooseApprovalStatus("Approval pending");
    await team.chooseReportsTo(process.env.REP_MAN_NAME);
    await team.filterBy("Project", ALPHA);
    await expect(page).toHaveURL(
      /search=.*approval=approval-pending.*reportsTo=.*compositeFilters=/,
    );

    const expectApplied = async () => {
      await expect(team.searchInput).toHaveValue(member.TmPending);
      await expect(team.approvalFilter).toContainText("Approval pending");
      await expect(team.reportsTo).toHaveValue(process.env.REP_MAN_NAME);
      await team.openFilterPanel();
      await expect(team.filterValue.last()).toHaveValue(ALPHA);
      await team.closeFilterPanel();
    };
    await expectApplied();

    const url = page.url();
    await page.reload();
    await expectApplied();

    await page.goto("about:blank");
    await page.goto(url);
    await expectApplied();
  });

  test("TC240: A member row opens onto its projects and tasks, and the totals add up", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmDraft });
    await team.expandMember(LAST, member.TmDraft);

    const alpha = team.projectRow(LAST, member.TmDraft, ALPHA);
    const beta = team.projectRow(LAST, member.TmDraft, "TM Beta");
    expect(await team.rowTotal(alpha)).toBe("06:00");
    expect(await team.rowTotal(beta)).toBe("02:00");

    const alphaTask = team.detailRow(LAST, member.TmDraft, ALPHA_TASK);
    expect(await team.rowDays(alphaTask)).toEqual([
      "02:00",
      "02:00",
      "02:00",
      "-",
      "-",
      "-",
      "-",
    ]);
    expect(await team.rowTotal(alphaTask)).toBe("06:00");
    const betaTask = team.detailRow(LAST, member.TmDraft, "TM Beta task");
    expect(await team.rowDays(betaTask)).toEqual([
      "-",
      "-",
      "-",
      "01:00",
      "01:00",
      "-",
      "-",
    ]);
    expect(await team.rowTotal(team.memberRow(LAST, member.TmDraft))).toBe(
      "08:00",
    );
  });

  test("TC241: Time-off shows on the member's row for the day it falls on and counts in the total", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmLeave });
    await team.expandMember(LAST, member.TmLeave);

    const timeOff = team.detailRow(LAST, member.TmLeave, "Time-off");
    expect(await team.rowDays(timeOff)).toEqual([
      "-",
      "04:00",
      "-",
      "-",
      "-",
      "-",
      "-",
    ]);
    // Tuesday: four hours logged plus the half day off; the week: 12 logged plus 4 off.
    const row = team.memberRow(LAST, member.TmLeave);
    expect((await team.rowDays(row)).slice(0, 2)).toEqual(["08:00", "08:00"]);
    expect(await team.rowTotal(row)).toBe("16:00");
  });

  test("TC242: The review button shows on a submitted week's row and not on one still to submit", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: SEARCH });
    await expect(
      team.reviewButton(team.memberRow(LAST, member.TmPending)),
    ).toHaveAccessibleName("Approval pending");
    await expect(
      team.reviewButton(team.memberRow(LAST, member.TmDraft)),
    ).toHaveCount(0);
  });

  test("TC243: Clicking a day on a member's row opens Add time for that member and day", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmDraft });
    await team.cells(team.memberRow(LAST, member.TmDraft)).nth(2).click();

    await expect(team.addTimeDialog).toBeVisible();
    await expect(
      team.addTimeDialog.getByPlaceholder("Select employee"),
    ).toHaveValue(member.TmDraft);
    await expect(
      team.addTimeDialog.getByRole("textbox", { name: "Date (required)" }),
    ).toHaveValue(lastWeek("Wed"));
    await expect(
      team.addTimeDialog.getByPlaceholder("Select project"),
    ).toHaveValue("");
    await expect(
      team.addTimeDialog.getByPlaceholder("Select task"),
    ).toHaveValue("");
  });

  test("TC244: The days of an Approved week cannot be clicked to add time", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: SEARCH });
    const cells = team.cells(team.memberRow(LAST, member.TmApproved));
    await expect(cells).toHaveCount(7);
    for (const index of [0, 1, 2, 3, 4, 5, 6]) {
      await expect(cells.nth(index)).toBeDisabled();
    }
    await cells.nth(0).click({ force: true });
    await expect(team.addTimeDialog).toHaveCount(0);
    // A week still to submit stays open for time.
    await expect(
      team.cells(team.memberRow(LAST, member.TmDraft)).nth(0),
    ).toBeEnabled();
  });

  test("TC245: Add time with empty fields shows a message under each and creates nothing", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    const saves = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /timesheet\.save/.test(request.url())
      ) {
        saves.push(request.url());
      }
    });

    await team.goto({ search: SEARCH });
    await team.addTimeButton.click();
    await team.addTimeDialog
      .getByRole("button", { name: "Save and close" })
      .click();
    for (const message of [
      "Please select an employee.",
      "Select Project",
      "Select Task",
      "Select Duration",
      "Please enter a comment.",
    ]) {
      await expect(team.addTimeDialog.getByText(message)).toBeVisible();
    }
    expect(saves).toHaveLength(0);
  });

  test("TC248: In Add time a duration longer than the hours left in the day is capped at the hours left", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmAddTime });
    // Tuesday of last week holds nothing, so the whole working day is left.
    await team.cells(team.memberRow(LAST, member.TmAddTime)).nth(1).click();
    await team.addTimeDialog.waitFor();
    await team.choose("Select project", ALPHA);
    await team.choose("Select task", ALPHA_TASK);
    const hint = team.addTimeDialog.getByText(/^\d+(\.\d+)?h left$/);
    const left = parseFloat(await hint.innerText());
    expect(left).toBeGreaterThan(0);

    const duration = team.addTimeDialog.getByPlaceholder("00:00");
    await duration.fill(`${Math.ceil(left) + 2}:00`);
    await duration.press("Tab");
    await expect(duration).toHaveValue(`${String(left).padStart(2, "0")}:00`);
    await expect(team.addTimeDialog.getByText("0h left")).toBeVisible();
  });

  test("TC250: Add time-off with empty fields asks for an employee, a leave type and a reason, and a multi-day half day asks for its date", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    const requests = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /Leave%20Application|Leave Application/.test(request.url())
      ) {
        requests.push(request.url());
      }
    });

    await team.goto({ search: SEARCH });
    await team.addTimeOffButton.click();
    await team.addTimeOffDialog.waitFor();
    await team.saveTimeOff();
    for (const message of [
      "Please select an employee.",
      "Please select leave type.",
      "Please enter a reason.",
    ]) {
      await expect(team.addTimeOffDialog.getByText(message)).toBeVisible();
    }

    // Over several days, a half day needs the day it falls on, and it has to be inside the range.
    await team.fillTimeOff({
      employee: member.TmTimeOff,
      from: day(0),
      to: day(2),
      duration: "First Half",
      type: "Unpaid Time Off",
      reason: "TC250 - half day over several days",
    });
    await team.saveTimeOff();
    await expect(
      team.addTimeOffDialog.getByText("Please select half day date."),
    ).toBeVisible();

    await team.pickDate(team.halfDayField, day(2));
    await team.pickDate(team.dateFields.nth(1), day(1));
    await team.saveTimeOff();
    await expect(
      team.addTimeOffDialog.getByText(
        "Half day date must be between from date and to date.",
      ),
    ).toBeVisible();
    expect(requests).toHaveLength(0);
  });

  test("TC251: The approval drawer lists each day's entries ticked, and Approve and Reject need a ticked day", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmPending });
    await team.openDrawer(LAST, member.TmPending);
    await expect(
      team.drawer.getByRole("heading", { name: member.TmPending }),
    ).toBeVisible();

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"].map(lastWeek);
    for (const date of days) {
      await expect(team.dayHeader(date)).toContainText("01:00");
      await expect(team.dayCheckbox(date)).toBeChecked();
      const entries = team.dayPanel(date);
      await expect(entries).toContainText(ALPHA_TASK);
      await expect(entries).toContainText(ALPHA);
      await expect(entries).toContainText("01:00");
    }
    await expect(team.approveButton).toBeEnabled();
    await expect(team.rejectButton).toBeEnabled();

    for (const date of days) await team.dayCheckbox(date).click();
    await expect(team.approveButton).toBeDisabled();
    await expect(team.rejectButton).toBeDisabled();
  });

  test("TC252: A day with leave shows its label in the drawer and counts the leave in the day's hours", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmLeave });
    await team.openDrawer(LAST, member.TmLeave);

    // Four hours logged and half a day off.
    await expect(team.dayHeader(lastWeek("Tue"))).toHaveAccessibleName(
      // Sites without the First/Second half field label it "Half day off".
      /· (First half|Half day) off 08:00$/,
    );
    await expect(team.dayHeader(lastWeek("Mon"))).not.toContainText("off");
    await expect(team.drawer).toContainText("16:00");
  });

  test("TC253: Saving an entry in the drawer without a comment asks for one and sends nothing", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    const updates = [];
    page.on("request", (request) => {
      if (/update_timesheet_detail/.test(request.url())) {
        updates.push(request.url());
      }
    });

    await team.goto({ search: member.TmPending });
    await team.openDrawer(LAST, member.TmPending);
    const panel = await team.editFirstEntry(lastWeek("Mon"));
    await panel.locator("[contenteditable]").first().fill("");
    await team.entrySave(panel).click();
    await expect(panel.getByText("Please enter a comment.")).toBeVisible();
    expect(updates).toHaveLength(0);
  });

  test("TC254: Rejecting without a reason asks for one and sends nothing", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    const decisions = [];
    page.on("request", (request) => {
      if (/approve_or_reject_timesheet/.test(request.url())) {
        decisions.push(request.url());
      }
    });

    await team.goto({ search: member.TmPending });
    await team.openDrawer(LAST, member.TmPending);
    await team.rejectButton.click();
    await expect(team.rejectDialog).toBeVisible();
    await team.rejectSubmit.click();
    await expect(
      team.rejectDialog.getByText("Please enter a reason."),
    ).toBeVisible();
    expect(decisions).toHaveLength(0);
  });

  test("TC261: An Approved week's drawer is read-only", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmApproved });
    await team.openDrawer(LAST, member.TmApproved);

    for (const date of ["Mon", "Tue", "Wed", "Thu", "Fri"].map(lastWeek)) {
      await expect(team.dayCheckbox(date)).not.toBeChecked();
      await expect(team.dayCheckbox(date)).toBeDisabled();
    }
    await expect(team.approveButton).toBeDisabled();
    await expect(team.rejectButton).toBeDisabled();
    const edits = team.drawer.getByRole("button", { name: "Edit time entry" });
    await expect(edits).toHaveCount(5);
    for (const index of [0, 1, 2, 3, 4]) {
      await expect(edits.nth(index)).toBeDisabled();
    }
  });

  test("TC262: A rejected entry shows its reason and rejected hours in the drawer and cannot be decided again", async () => {
    allure.story("Team Timesheet");
    await team.goto({ search: member.TmRejected });
    await team.openDrawer(LAST, member.TmRejected);

    const monday = lastWeek("Mon");
    // Rejected hours leave the day's total: 00:00 against the 01:00 entry.
    await expect(team.dayHeader(monday)).toHaveAccessibleName(
      new RegExp(`00:00$`),
    );
    await expect(team.dayCheckbox(monday)).toBeDisabled();
    const reason = team.dayPanel(monday).getByRole("alert");
    await expect(
      reason.getByRole("heading", { name: "Rejection reason" }),
    ).toBeVisible();
    await expect(reason).toContainText(
      "TC262 - Monday needs a clearer comment",
    );
    await expect(team.dayPanel(monday)).toContainText("01:00");
    // The days still pending stay open to a decision.
    await expect(team.dayCheckbox(lastWeek("Tue"))).toBeChecked();
  });
});
