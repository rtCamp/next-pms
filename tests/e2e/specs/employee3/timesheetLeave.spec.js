const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { TimesheetWeeksPage } from "../../pageObjects/timesheetWeeksPage";
import {
  createDocument,
  deleteDocument,
  getDocList,
} from "../../utils/api/apiClient";
import { dateInWeek, weekLabel } from "../../utils/dateUtils";

const REASON = "TC217 - half day";
const WORKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

test.describe("Employee3: Time-off on the timesheet", () => {
  /** @type {TimesheetWeeksPage} */ let weeks;

  test.beforeEach(({ page }) => {
    weeks = new TimesheetWeeksPage(page);
  });

  test("TC217: A half-day time-off shows on the grid as half the working day", async () => {
    allure.story("Timesheet");
    const leaves = () =>
      getDocList(
        "Leave Application",
        [
          ["employee", "=", process.env.EMP3_ID],
          ["description", "=", REASON],
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
      await weeks.goto();
      // The dialog refuses a past day and the grid lists no week after this one, so the leave
      // is one an admin books in a past week, on a working day that nothing has taken yet
      // (a holiday or an earlier leave already reads as time off).
      let target;
      for (const weeksAgo of [1, 2, 3]) {
        const label = weekLabel(weeksAgo);
        await weeks.expandWeek(label);
        const day = (await weeks.timeOffHours(label))
          .slice(0, WORKDAYS.length)
          .indexOf("-");
        if (day !== -1) {
          target = { label, day, date: dateInWeek(weeksAgo, WORKDAYS[day]) };
          break;
        }
      }
      expect(
        target,
        "a working day in the last three weeks that has no time off",
      ).toBeDefined();

      await createDocument("Leave Application", {
        employee: process.env.EMP3_ID,
        leave_type: "Unpaid Time Off",
        from_date: target.date,
        to_date: target.date,
        half_day: 1,
        half_day_date: target.date,
        description: REASON,
      });

      await weeks.reload(target.label);
      await expect
        .poll(async () => (await weeks.timeOffHours(target.label))[target.day])
        .toBe("04:00");
    } finally {
      await clear();
    }
  });
});
