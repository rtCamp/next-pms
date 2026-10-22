const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { TimesheetWeeksPage } from "../../pageObjects/timesheetWeeksPage";
import {
  deleteDocument,
  getDocList,
  getDocument,
} from "../../utils/api/apiClient";
import {
  dateInWeek,
  getFormattedDate,
  nextWorkday,
  weekLabel,
} from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";
import { findProjectId } from "../../utils/testCase";

// TC208 seeds the weeks every case below reads; see data/employee/timesheetWeeks.js.
const FIXTURE = "TC208";
const [LAST, TWO, THREE] = [1, 2, 3].map(weekLabel);

// "Oct 5": how a week header prints a day.
const shortDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

// "02:00" to 2
const hoursOf = (text) => {
  const [hours, minutes] = text.split(":").map(Number);
  return hours + minutes / 60;
};

// Serial: the cases share one employee's weeks, and the last few change them.
test.describe.configure({ mode: "serial" });

test.describe("Employee: Personal timesheet weeks", () => {
  /** @type {TimesheetWeeksPage} */ let weeks;
  let data;
  let alphaProject;
  let betaProject;
  let alphaTask;
  let betaTask;

  test.beforeEach(async ({ page, jsonDir }) => {
    weeks = new TimesheetWeeksPage(page);
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
    alphaProject = data.payloadCreateProject.project_name;
    betaProject = data.payloadCreateProject2.project_name;
    [alphaTask, betaTask] = [0, 1].map(
      (index) => data.payloadCreateWeekTime[index].subject,
    );
  });

  test("TC208: The week grid lists weeks newest first with their status, day columns, total and buttons", async () => {
    allure.story("Timesheet");
    await weeks.goto();

    for (const [index, pattern] of [
      /^This week/,
      /^Last week/,
      new RegExp(`^${TWO}`),
      new RegExp(`^${THREE}`),
    ].entries()) {
      await expect(weeks.weekHeaders.nth(index)).toHaveText(pattern);
    }

    // Every week shows its status, the seven days with their dates, and a Total.
    for (const [label, weeksAgo] of [
      [LAST, 1],
      [TWO, 2],
    ]) {
      const header = weeks.weekHeader(label);
      for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
        await expect(header).toContainText(
          shortDate(dateInWeek(weeksAgo, day)),
        );
      }
      await expect(header).toContainText("Total");
    }
    await expect(weeks.weekHeader(LAST)).toContainText("Not submitted");
    await expect(weeks.weekHeader(TWO)).toContainText("Approval pending");

    // The time seeded for last week sits under its project and task, on the day it was booked.
    await weeks.expandWeek(LAST);
    const alpha = weeks.row(LAST, alphaProject);
    await expect(alpha).toBeVisible();
    await expect(weeks.cells(alpha).nth(0)).toHaveText("02:00");
    const task = weeks.row(LAST, alphaTask);
    await expect(weeks.cells(task).nth(0)).toHaveText("02:00");
    await expect(weeks.cells(weeks.row(LAST, betaTask)).nth(1)).toHaveText(
      "03:00",
    );

    // The week's Total adds up its days, and Submit for approval is offered while it can be sent.
    const total = weeks.totalRow(LAST);
    const days = await weeks.cells(total).allInnerTexts();
    const sum = days.reduce(
      (hours, day) => hours + (day === "-" ? 0 : hoursOf(day)),
      0,
    );
    expect(hoursOf(await weeks.rowTotal(total))).toBe(sum);
    await expect(weeks.submitButton(LAST)).toBeVisible();
    await expect(weeks.submitButton(TWO)).toHaveCount(0);
    await expect(
      weeks
        .weekRegion(LAST)
        .getByRole("button", { name: "Import liked tasks to this week" }),
    ).toBeVisible();
  });

  test("TC209: Searching tasks narrows the grid to the matching tasks and hides the Total row", async ({
    page,
  }) => {
    allure.story("Timesheet");
    await weeks.goto();
    await weeks.expandWeek(LAST);
    await expect(weeks.row(LAST, alphaTask)).toBeVisible();
    await expect(weeks.row(LAST, betaTask)).toBeVisible();
    const totalButton = weeks
      .weekRegion(LAST)
      .getByRole("button", { name: "Projects", exact: true });
    await expect(totalButton).toBeVisible();

    await weeks.search(alphaTask);
    await expect(page).toHaveURL(/search=/);
    await expect(weeks.row(LAST, alphaTask)).toBeVisible();
    await expect(weeks.row(LAST, betaTask)).toHaveCount(0);
    await expect(totalButton).toHaveCount(0);

    await weeks.search("");
    await expect(weeks.row(LAST, betaTask)).toBeVisible();
    await expect(totalButton).toBeVisible();
  });

  test("TC210: The Approval status filter narrows the weeks to those with that status", async ({
    page,
  }) => {
    allure.story("Timesheet");
    await weeks.goto();
    // What the seeded weeks read: submitted, and approved (or partly approved on a site with few days off).
    const pending = await weeks.weekStatus(TWO);
    const approved = await weeks.weekStatus(THREE);
    expect(pending).toBe("Approval pending");
    expect(approved).toMatch(/approved/i);

    for (const [status, shown, hidden] of [
      [pending, TWO, THREE],
      [approved, THREE, TWO],
    ]) {
      await weeks.goto();
      await weeks.chooseApprovalStatus(status);
      await expect(page).toHaveURL(/approval=/);
      await expect(weeks.weekHeader(shown)).toBeVisible();
      await expect(weeks.weekHeader(hidden)).toHaveCount(0);
      await expect(weeks.weekHeader(LAST)).toHaveCount(0);
      // Every week left carries the chosen status.
      for (const header of await weeks.weekHeaders.all()) {
        await expect(header.locator("div.rounded-full").first()).toHaveText(
          status,
        );
      }
    }
  });
  test("TC211: The Filter panel narrows the weeks and rows by project, task and date", async ({
    page,
  }) => {
    allure.story("Timesheet");

    await test.step("Project", async () => {
      await weeks.goto();
      await weeks.filterBy("Project", alphaProject);
      await expect(weeks.row(LAST, alphaProject)).toBeVisible();
      await expect(weeks.row(LAST, betaProject)).toHaveCount(0);
      await expect(weeks.row(TWO, alphaProject)).toBeVisible();
      // A week with no time on the project drops out.
      await expect(weeks.weekHeader(THREE)).toHaveCount(0);
    });

    await test.step("Task", async () => {
      await weeks.goto();
      await weeks.filterBy("Task", betaTask);
      await expect(weeks.row(LAST, betaTask)).toBeVisible();
      await expect(weeks.row(LAST, alphaTask)).toHaveCount(0);
      await expect(weeks.row(THREE, betaTask)).toBeVisible();
      await expect(weeks.weekHeader(TWO)).toHaveCount(0);
    });

    await test.step("Date", async () => {
      await weeks.goto();
      // Monday to Wednesday of the submitted week: only the weeks it touches stay.
      await weeks.filterByDate(dateInWeek(2, "Mon"), dateInWeek(2, "Wed"));
      await expect(weeks.row(TWO, alphaTask)).toBeVisible();
      await expect(weeks.weekHeader(LAST)).toHaveCount(0);
      await expect(weeks.weekHeader(THREE)).toHaveCount(0);
    });

    await test.step("Clear all filters", async () => {
      await weeks.clearAllFiltersButton.click();
      await expect(weeks.row(LAST, alphaProject)).toBeVisible();
      await expect(weeks.row(THREE, betaProject)).toBeVisible();
      await expect(page).not.toHaveURL(/compositeFilters/);
    });
  });

  test("TC212: Search, Approval status and filter conditions stay applied after a reload and when the URL is opened directly", async ({
    page,
  }) => {
    allure.story("Timesheet");
    await weeks.goto();
    await weeks.search(alphaTask);
    await weeks.chooseApprovalStatus("Not submitted");
    await weeks.filterBy("Project", alphaProject);
    await expect(page).toHaveURL(/search=.*approval=.*compositeFilters=/);

    const expectApplied = async () => {
      await expect(weeks.searchInput).toHaveValue(alphaTask);
      await expect(weeks.approvalFilter).toContainText("Not submitted");
      await expect(weeks.filterButton).toContainText("3");
      await expect(weeks.weekHeader(LAST)).toBeVisible();
      await expect(weeks.row(LAST, alphaTask)).toBeVisible();
      await expect(weeks.weekHeader(TWO)).toHaveCount(0);
    };
    await expectApplied();

    const url = page.url();
    await page.reload();
    await expectApplied();

    await page.goto("about:blank");
    await page.goto(url);
    await expectApplied();
  });

  test("TC213: Add time with empty fields shows a message under each and creates nothing", async ({
    page,
  }) => {
    allure.story("Timesheet");
    const saves = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /timesheet\.save/.test(request.url())
      ) {
        saves.push(request.url());
      }
    });

    await weeks.goto();
    await weeks.addTimeButton.click();
    await weeks.addTimeDialog
      .getByRole("button", { name: "Save and close" })
      .click();

    for (const message of [
      "Select Project",
      "Select Task",
      "Select Duration",
      "Please enter a comment.",
    ]) {
      await expect(weeks.addTimeDialog.getByText(message)).toBeVisible();
    }
    expect(saves).toHaveLength(0);
  });

  test("TC214: A duration longer than the hours left in the day is capped at the hours left", async () => {
    allure.story("Timesheet");
    await weeks.goto();
    await weeks.expandWeek(LAST);
    // Wednesday of last week has nothing booked, so the whole working day is left.
    await weeks.cells(weeks.totalRow(LAST)).nth(2).click();
    await weeks.addTimeDialog.waitFor();
    await weeks.choose("Select project", alphaProject);
    await weeks.choose("Select task", alphaTask);
    const hint = weeks.addTimeDialog.getByText(/^\d+(\.\d+)?h left$/);
    const left = parseFloat(await hint.innerText());
    expect(left).toBeGreaterThan(0);

    const duration = weeks.addTimeDialog.getByPlaceholder("00:00");
    await duration.fill(`${Math.ceil(left) + 2}:00`);
    await duration.press("Tab");
    await expect(duration).toHaveValue(`${String(left).padStart(2, "0")}:00`);
    await expect(weeks.addTimeDialog.getByText("0h left")).toBeVisible();
    await expect(weeks.addTimeDialog.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      String(left * 60),
    );
  });

  test("TC228: Adding time before the backdate limit is refused with the earliest date that is allowed", async () => {
    allure.story("Timesheet");
    const settings = await getDocument(
      "Timesheet Settings",
      "Timesheet Settings",
    );
    const limit = settings.allow_backdated_entries
      ? settings.allow_backdated_entries_till_employee
      : 0;
    // A weekday a month past the limit.
    const past = new Date(Date.now() - (limit + 30) * 24 * 60 * 60 * 1000);
    while ([0, 6].includes(past.getDay())) past.setDate(past.getDate() - 1);
    const date = getFormattedDate(past);

    const bookedOn = async () =>
      (
        await getDocList(
          "Timesheet",
          [
            ["employee", "=", process.env.EMP2_ID],
            ["start_date", "=", date],
          ],
          { fields: ["name"] },
        )
      ).length;
    const before = await bookedOn();

    await weeks.goto();
    await weeks.addTimeButton.click();
    await weeks.addTimeDialog.waitFor();
    await weeks.choose("Select project", alphaProject);
    await weeks.choose("Select task", alphaTask);
    await weeks.pickDate(weeks.dateField, date);
    await weeks.addTimeDialog.getByPlaceholder("00:00").fill("01:00");
    await weeks.addTimeDialog
      .locator("[contenteditable]")
      .first()
      .fill("TC228 - time before the limit");
    await weeks.addTimeDialog
      .getByRole("button", { name: "Save and close" })
      .click();

    // The message sits in the dialog, which stays open with what was typed.
    await expect(
      weeks.addTimeDialog.getByText(
        /Backdated time entries are not allowed\. The earliest date you can log time for is \d{2}-\d{2}-\d{4}/,
      ),
    ).toBeVisible();
    expect(await bookedOn()).toBe(before);
  });

  test("TC215: Time added to a future date follows the Allow Future Entries setting", async () => {
    allure.story("Timesheet");
    const { allow_future_entries: allowed } = await getDocument(
      "Timesheet Settings",
      "Timesheet Settings",
    );
    const date = nextWorkday();
    // Only this case's project: the day may hold the employee's own time.
    const alphaId = await findProjectId(data.payloadCreateProject);
    const booked = () =>
      getDocList(
        "Timesheet",
        [
          ["employee", "=", process.env.EMP2_ID],
          ["parent_project", "=", alphaId],
          ["start_date", "=", date],
        ],
        { fields: ["name"] },
      );

    try {
      await weeks.goto();
      await weeks.addTimeButton.click();
      await weeks.addTimeDialog.waitFor();
      await weeks.choose("Select project", alphaProject);
      await weeks.choose("Select task", alphaTask);
      await weeks.pickDate(weeks.dateField, date);
      await weeks.addTimeDialog.getByPlaceholder("00:00").fill("01:00");
      await weeks.addTimeDialog
        .locator("[contenteditable]")
        .first()
        .fill("TC215 - time on a future date");
      await weeks.addTimeDialog
        .getByRole("button", { name: "Save and close" })
        .click();

      if (allowed) {
        await expect(weeks.addTimeDialog).toBeHidden();
        await expect.poll(async () => (await booked()).length).toBe(1);
      } else {
        // Refused: the dialog stays open with its values and nothing is booked.
        await expect(weeks.addTimeDialog).toBeVisible();
        expect(await booked()).toHaveLength(0);
      }
    } finally {
      for (const { name } of await booked()) {
        await deleteDocument("Timesheet", name);
      }
    }
  });

  test("TC216: Add time-off with empty fields asks for a leave type and a reason, and a multi-day half day asks for its date", async ({
    page,
  }) => {
    allure.story("Timesheet");
    const requests = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /Leave%20Application|Leave Application/.test(request.url())
      ) {
        requests.push(request.url());
      }
    });
    const day = (offset) =>
      getFormattedDate(new Date(Date.now() + offset * 24 * 60 * 60 * 1000));

    await weeks.goto();
    await weeks.addTimeOffButton.click();
    await weeks.addTimeOffDialog.waitFor();
    await weeks.saveTimeOff();
    for (const message of [
      "Please select leave type.",
      "Please enter a reason.",
    ]) {
      await expect(weeks.addTimeOffDialog.getByText(message)).toBeVisible();
    }

    // Over several days, a half day needs the day it falls on, and it has to be inside the range.
    await weeks.fillTimeOff({
      from: day(0),
      to: day(2),
      duration: "First Half",
      type: "Unpaid Time Off",
      reason: "TC216 - half day over several days",
    });
    await weeks.saveTimeOff();
    await expect(
      weeks.addTimeOffDialog.getByText("Please select half day date."),
    ).toBeVisible();

    await weeks.pickDate(weeks.halfDayField, day(2));
    await weeks.pickDate(weeks.dateFields.nth(1), day(1));
    await weeks.saveTimeOff();
    await expect(
      weeks.addTimeOffDialog.getByText(
        "Half day date must be between from date and to date.",
      ),
    ).toBeVisible();
    expect(requests).toHaveLength(0);
  });

  test("TC218: The weekly total recalculates after a time entry is edited and deleted", async () => {
    allure.story("Timesheet");
    const comment = "TC218 - time added from the grid";
    // Thursday of last week has nothing booked; an earlier attempt may have left an entry.
    const thursday = dateInWeek(1, "Thu");
    const alphaId = await findProjectId(data.payloadCreateProject);
    const clear = async () => {
      for (const { name } of await getDocList(
        "Timesheet",
        [
          ["employee", "=", process.env.EMP2_ID],
          ["parent_project", "=", alphaId],
          ["start_date", "=", thursday],
        ],
        { fields: ["name"] },
      )) {
        await deleteDocument("Timesheet", name);
      }
    };
    await clear();

    await weeks.goto();
    await weeks.expandWeek(LAST);
    const total = async () =>
      hoursOf(await weeks.rowTotal(weeks.totalRow(LAST)));
    const cell = weeks.cells(weeks.row(LAST, alphaTask)).nth(3);
    try {
      const before = await total();

      // Each change is read from a fresh load: see reload() for why.
      await weeks.addTime(LAST, 3, {
        project: alphaProject,
        task: alphaTask,
        duration: "02:00",
        comment,
      });
      await weeks.reload(LAST);
      await expect(cell).toHaveText("02:00");
      expect(await total()).toBe(before + 2);

      await weeks.updateEntry(cell, { comment, duration: "03:30" });
      await weeks.reload(LAST);
      await expect(cell).toHaveText("03:30");
      expect(await total()).toBe(before + 3.5);

      await weeks.deleteEntry(cell, comment);
      await weeks.reload(LAST);
      await expect(cell).toHaveText("-");
      expect(await total()).toBe(before);
    } finally {
      await clear();
    }
  });

  test("TC219: Import liked tasks adds the starred tasks to this week", async () => {
    allure.story("Timesheet");
    const liked = data.payloadLikeTasks[0].subject;
    await weeks.goto();
    await weeks.expandWeek("This week");
    await expect(weeks.row("This week", liked)).toHaveCount(0);

    await weeks
      .weekRegion("This week")
      .getByRole("button", { name: "Import liked tasks to this week" })
      .click();
    const row = weeks.row("This week", liked);
    await expect(row).toBeVisible();
    // Only the task is added, with no time on it.
    await expect(weeks.cells(row).first()).toHaveText("-");
  });

  test("TC221: An approved week is read-only", async () => {
    allure.story("Timesheet");
    await weeks.goto();
    await weeks.expandWeek(THREE);
    expect(await weeks.weekStatus(THREE)).toMatch(/approved/i);

    // The days that were approved cannot be opened, and the week cannot be sent again.
    const task = weeks.row(THREE, betaTask);
    for (const day of [0, 1, 2, 3, 4]) {
      await expect(weeks.cells(task).nth(day)).toBeDisabled();
    }
    await expect(weeks.submitButton(THREE)).toHaveCount(0);
  });
});
