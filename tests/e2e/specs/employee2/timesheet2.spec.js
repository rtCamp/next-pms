import path from "path";
const { test, expect } = require("../../playwright.fixture.cjs");
import { resetTimeEntries } from "../../helpers/timesheetHelper";
import {
  TimesheetPage,
  durationPattern,
} from "../../pageObjects/timesheetPage";
import { readJSONFile } from "../../utils/fileUtils";
import * as allure from "allure-js-commons";

//Add type hints to help VS Code recognize TimesheetPage
/** @type {TimesheetPage} */
let timesheetPage;

test.describe("Employee 2 : Timesheet", () => {
  // These write to one employee's week, and the server can answer a read with the week
  // from before a parallel write, so they run one at a time.
  test.describe.configure({ mode: "serial" });

  // Runs before each test
  test.beforeEach(async ({ page }) => {
    // Instantiate page objects
    timesheetPage = new TimesheetPage(page);
    // Switch to Timesheet tab
    await timesheetPage.goto();
  });

  test("TC2: Time should be added using the ‘Add’ button at the top.", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC2.json");
    const data = await readJSONFile(stubPath);
    const TC2data = data.TC2;
    // A retry starts from the week as setup left it, not on top of the last attempt.
    if (await resetTimeEntries(TC2data, "employee2")) await page.reload();
    // Add time entry using "Time" button; it returns once the save has answered
    await timesheetPage.addTimeViaTimeButton(TC2data.taskInfo);

    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(TC2data.cell);
    expect(cellText).toMatch(durationPattern(TC2data.taskInfo.duration));
  });
  test("TC3: Time should be added using the direct timesheet add buttons.", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Timesheet");
    // 1) Build the path to your per‑TC JSON stub
    const stubPath = path.join(jsonDir, "TC3.json");
    const data = await readJSONFile(stubPath);

    const TC3data = data.TC3;
    if (await resetTimeEntries(TC3data, "employee2")) await page.reload();

    // Import liked tasks
    await timesheetPage.importLikedTasks();
    // Add time entry using "+" button in timesheet
    await timesheetPage.addTimeViaCell(TC3data.cell, {
      duration: TC3data.taskInfo.duration,
      desc: TC3data.taskInfo.desc,
    });
    await timesheetPage
      .toastNotification(TC3data.notification)
      .waitFor({ state: "visible" });
    // Reload page to ensure changes are reflected
    await page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(TC3data.cell);
    expect(cellText).toMatch(durationPattern(TC3data.taskInfo.duration));
  });

  test("TC13: Verify an employee can apply for leave via Timesheet tab.   ", async ({
    jsonDir,
  }) => {
    allure.story("Timesheet");
    const stubPath = path.join(jsonDir, "TC13.json");
    const data = await readJSONFile(stubPath);
    const TC13data = data.TC13;
    // Apply for leave
    await timesheetPage.applyForLeave(TC13data.leave.desc);

    // Reload page to ensure changes are reflected
    await timesheetPage.page.reload();

    // Assertions
    const cellText = await timesheetPage.getCellText(TC13data.cell);
    expect(cellText).toContain("8");
  });
});
