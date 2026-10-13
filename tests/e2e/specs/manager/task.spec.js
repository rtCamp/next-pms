import path from "path";
const { test, expect } = require("../../playwright.fixture.cjs");
import { TaskPage } from "../../pageObjects/taskPage";
import { readJSONFile } from "../../utils/fileUtils";
import * as allure from "allure-js-commons";
//Add type hints to help VS Code recognize TaskPage
/** @type {TaskPage} */
let taskPage;
// ------------------------------------------------------------------------------------------
test.describe("Manager : Task", () => {
  test.beforeEach(async ({ page }) => {
    // Instantiate page objects
    taskPage = new TaskPage(page);
    // Switch to Task tab
    await taskPage.goto();
  });
  // ------------------------------------------------------------------------------------------
  test("TC17: Validate the search functionality   ", async ({ jsonDir }) => {
    allure.story("Task");
    const stubPath = path.join(jsonDir, "TC17.json");
    const data = await readJSONFile(stubPath);
    const TC17data = data.TC17;
    const taskName = TC17data.payloadCreateTask.subject;

    // Search task
    await taskPage.searchTask(taskName);

    // Assertions. The search is debounced, so these retry until the list
    // swaps the unfiltered rows for the results.
    const rows = await taskPage.getTaskRows();
    await expect(rows.filter({ hasNotText: taskName })).toHaveCount(0);
    await expect(rows).not.toHaveCount(0);
  });

  test("TC19: Open task details popup   ", async ({ jsonDir }) => {
    allure.story("Task");
    const stubPath = path.join(jsonDir, "TC19.json");
    const data = await readJSONFile(stubPath);
    const TC19data = data.TC19;
    const taskName = TC19data.payloadCreateTask.subject;
    // Search task
    await taskPage.searchTask(taskName);

    // Open task details
    await taskPage.openTaskDetails(taskName);

    // Assertions
    const isTaskDetailsDialogVisible =
      await taskPage.isTaskDetailsDialogVisible(taskName);
    expect(isTaskDetailsDialogVisible).toBeTruthy();
  });

  // The Columns popover hides, re-adds and reorders the default columns. There
  // is no saved view: the layout is kept in the URL, so a reload is what checks
  // that it sticks.
  test("TC20: The information table columns should be customizable using the ‘Columns’ button at the top.   ", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Task");
    const stubPath = path.join(jsonDir, "TC20.json");
    const data = await readJSONFile(stubPath);
    const TC20data = data.TC20;
    const column = taskPage.columnHeader(TC20data.col);

    // The page opens on the default columns, which include this one.
    await expect(column).toBeVisible();

    await taskPage.removeColumn(TC20data.col);
    await expect(column).toHaveCount(0);

    await page.reload();
    // Wait for the table to render before asserting the column is absent.
    await expect(taskPage.columnHeader("Subject")).toBeVisible();
    await expect(column).toHaveCount(0);

    await taskPage.addColumn(TC20data.col);
    await expect(column).toBeVisible();
  });

  test("TC22: A task like/favourite functionality.", async ({ jsonDir }) => {
    allure.story("Task");
    const stubPath = path.join(jsonDir, "TC22.json");
    const data = await readJSONFile(stubPath);
    const TC22data = data.TC22;
    const taskName = TC22data.payloadCreateTask.subject;

    // Search task
    await taskPage.searchTask(taskName);

    //Assertion to verify if the task liked is showing red heart
    await taskPage.assertTaskIsLiked(taskName);
  });

  test("TC24: Verify task addition", async ({ jsonDir }) => {
    allure.story("Task");
    const stubPath = path.join(jsonDir, "TC24.json");
    const data = await readJSONFile(stubPath);
    const TC24data = data.TC24;
    // Add a task
    await taskPage.AddTask(TC24data.taskInfo);

    // Search task
    await taskPage.searchTask(TC24data.taskInfo.task);

    // Open task details
    await taskPage.openTaskDetails(TC24data.taskInfo.task);

    // Assertions to verify that created task is visible
    const isTaskDetailsDialogVisible =
      await taskPage.isTaskDetailsDialogVisible(TC24data.taskInfo.task);
    expect(isTaskDetailsDialogVisible).toBeTruthy();
  });

  // TC25/TC26 used to add an "Is Billable" column and read the cell. The
  // redesign removed the Columns button, but kept "Is Billable" as a filter
  // field, so both now assert the status through the filter instead. Each runs
  // two filter passes plus a search, which is more than the 30s default budget
  // allows once slowMo's half-second per action is counted.
  test("TC25: Verify the billable status of a billable task.    ", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    test.setTimeout(90000);
    const stubPath = path.join(jsonDir, "TC25.json");
    const data = await readJSONFile(stubPath);
    const TC25data = data.TC25;

    // Assertions
    const isTaskBillable = await taskPage.isTaskBillable(
      TC25data.payloadCreateTask.subject,
    );
    expect(isTaskBillable).toBeTruthy();
  });

  test("TC26: Verify the billable status of a non-billable task.    ", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    test.setTimeout(90000);
    const stubPath = path.join(jsonDir, "TC26.json");
    const data = await readJSONFile(stubPath);
    const TC26data = data.TC26;

    // Assertions
    const isTaskBillable = await taskPage.isTaskBillable(
      TC26data.payloadCreateTask.subject,
    );
    expect(isTaskBillable).toBeFalsy();
  });
});
