import path from "path";
import { test, expect } from "@playwright/test";
import { TaskPage } from "../../pageObjects/taskPage";
import data from "../../data/manager/task.json";

//Add type hints to help VS Code recognize TimesheetPage
/** @type {TaskPage} */
let taskPage;

// Load test data
let TC17data = data.TC17;
let TC19data = data.TC19;
let TC20data = data.TC20;
let TC25data = data.TC25;
let TC26data = data.TC26;
let TC24data = data.TC24;

// ------------------------------------------------------------------------------------------

// Load authentication state from 'manager.json'
test.use({ storageState: path.resolve(__dirname, "../../auth/manager.json") });

test.beforeEach(async ({ page }) => {
  // Instantiate page objects
  taskPage = new TaskPage(page);

  // Switch to Task tab
  await taskPage.goto();
});

// ------------------------------------------------------------------------------------------

test("TC17: Validate the search functionality", async ({}) => {
  // Search task
  await taskPage.searchTask(TC17data.task);

  // Assertions
  const filteredTasks = await taskPage.getTasks();
  expect(filteredTasks.length).toBeGreaterThanOrEqual(1);
  filteredTasks.forEach((task) => {
    expect(task).toContain(TC17data.task);
  });
});

test("TC19: Open task details popup", async ({}) => {
  // Search task
  await taskPage.searchTask(TC19data.task);

  // Open task details
  await taskPage.openTaskDetails(TC19data.task);

  // Assertions
  const isTaskDetailsDialogVisible = await taskPage.isTaskDetailsDialogVisible(TC19data.task);
  expect(isTaskDetailsDialogVisible).toBeTruthy();
});

test("TC24: Verify task addition", async ({}) => {
  // Add a task
  await taskPage.AddTask(TC24data.taskInfo);


// Search task
await taskPage.searchTask(TC24data.taskInfo.task);

// Open task details
await taskPage.openTaskDetails(TC24data.taskInfo.task);

// Assertions to verify that created task is visible
const isTaskDetailsDialogVisible = await taskPage.isTaskDetailsDialogVisible(TC24data.taskInfo.task);
expect(isTaskDetailsDialogVisible).toBeTruthy();
});

test("TC24: Verify task addition", async ({}) => {
  // Add a task
  await taskPage.AddTask(TC24data.taskInfo);


// Search task
await taskPage.searchTask(TC24data.taskInfo.task);

// Open task details
await taskPage.openTaskDetails(TC24data.taskInfo.task);

// Assertions to verify that created task is visible
const isTaskDetailsDialogVisible = await taskPage.isTaskDetailsDialogVisible(TC24data.taskInfo.task);
expect(isTaskDetailsDialogVisible).toBeTruthy();
});

test("TC20: The information table columns should be customizable using the ‘Columns’ button at the top.", async ({}) => {
  // Add column to view and save
  await taskPage.addColumn(TC20data.col);
  await taskPage.saveView();

  // Re-navigate to tab and store column status
  await taskPage.goto();
  const isColumnPresent1 = await taskPage.isColumnPresent(TC20data.col);

  // Remove column and save
  await taskPage.removeColumn(TC20data.col);
  await taskPage.saveView();

  // Re-navigate to tab and store column status
  await taskPage.goto();
  const isColumnPresent2 = await taskPage.isColumnPresent(TC20data.col);

  // Assertions
  expect(await isColumnPresent1).toBeTruthy();
  expect(await isColumnPresent2).toBeFalsy();
});

test("TC25: Verify the billable status of a billable task.", async ({}) => {
  // Add column to view
  await taskPage.addColumn("Is Billable");

  // Search task
  await taskPage.searchTask(TC25data.task);

  // Assertions
  const isTaskBillable = await taskPage.isTaskBillable(TC25data.task);
  expect(isTaskBillable).toBeTruthy();
});

test("TC26: Verify the billable status of a non-billable task.", async ({}) => {
  // Add column to view
  await taskPage.addColumn("Is Billable");

  // Search task
  await taskPage.searchTask(TC26data.task);

  // Assertions
  const isTaskBillable = await taskPage.isTaskBillable(TC26data.task);
  expect(isTaskBillable).toBeFalsy();
});
