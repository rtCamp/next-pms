const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { TimesheetWeeksPage } from "../../pageObjects/timesheetWeeksPage";
import {
  cancelDocument,
  deleteDocument,
  getDocList,
} from "../../utils/api/apiClient";
import { createTimesheet } from "../../utils/api/timesheetRequests";
import { dateInWeek, weekLabel } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";
import { findProjectId } from "../../utils/testCase";

// "Sep 28": how the dialog prints a day.
const shortDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

test.describe("Employee: Submit a week for approval", () => {
  /** @type {TimesheetWeeksPage} */ let weeks;

  test.beforeEach(({ page }) => {
    weeks = new TimesheetWeeksPage(page);
  });

  test("TC220: A week that can be submitted asks for an approver and then reads Approval pending", async ({
    jsonDir,
  }) => {
    allure.story("Timesheet");
    const data = (await readJSONFile(path.join(jsonDir, "TC220.json")))[
      "TC220"
    ];
    const project = await findProjectId(data.payloadCreateProject);
    const label = weekLabel(3);

    // The case books its own week and removes it, so a retry starts from the same place.
    const booked = () =>
      getDocList(
        "Timesheet",
        [
          ["employee", "=", process.env.EMP_ID],
          ["parent_project", "=", project],
        ],
        { fields: ["name", "docstatus"] },
      );
    const clear = async () => {
      for (const { name, docstatus } of await booked()) {
        if (docstatus === 1) await cancelDocument("Timesheet", name);
        await deleteDocument("Timesheet", name);
      }
    };
    await clear();
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      await createTimesheet(
        {
          task: data.payloadDeleteTask.taskID,
          description: "<p>TC220 - time to send for approval</p>",
          hours: "1",
          date: dateInWeek(3, day),
          employee: process.env.EMP_ID,
        },
        "manager",
      );
    }

    try {
      await weeks.goto();
      await weeks.expandWeek(label);
      // Not submitted: the week can be sent.
      await expect(weeks.weekHeader(label)).toContainText("Not submitted");
      await expect(weeks.submitButton(label)).toBeVisible();

      await weeks.submitButton(label).click();
      await weeks.submitDialog.waitFor();
      await expect(weeks.submitDialog).toContainText(
        `${shortDate(dateInWeek(3, "Mon"))} - ${shortDate(dateInWeek(3, "Sun"))}`,
      );
      // The approver is the employee's reporting manager, and it has to be set.
      const sendTo = weeks.submitDialog.getByRole("combobox", {
        name: "Send to (required)",
      });
      await expect(sendTo).toHaveValue(process.env.REP_MAN_NAME);
      await weeks.submitDialog.getByRole("button", { name: "Submit" }).click();
      await expect(weeks.submitDialog).toBeHidden();

      // Waiting for approval: nothing left to submit. The status is read from a fresh
      // load, as the grid only follows the server through a realtime event.
      await expect
        .poll(
          async () => {
            await weeks.reload(label);
            return weeks.weekStatus(label);
          },
          { timeout: 60000, intervals: [3000] },
        )
        .toBe("Approval pending");
      await expect(weeks.submitButton(label)).toHaveCount(0);
    } finally {
      await clear();
    }
  });
});
