import path from "path";
import { test, expect } from "@playwright/test";
import { TaskPage } from "../../pageObjects/taskPage";
import data from "../../data/manager/task.json";
//Add type hints to help VS Code recognize TaskPage
/** @type {TaskPage} */
let taskPage;

// Load test data
let TC17data = data.TC17;
let TC19data = data.TC19;
let TC20data = data.TC20;
let TC25data = data.TC25;
let TC26data = data.TC26;

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

test("TC17: Validate the search functionality @workingTests", async ({}) => {
  const taskName = TC17data.payloadCreateTask.subject;
  // Search task
  await taskPage.searchTask(taskName);

  // Assertions
  const filteredTasks = await taskPage.getTasks();
  expect(filteredTasks.length).toBeGreaterThanOrEqual(1);
  filteredTasks.forEach((task) => {
    expect(task).toContain(taskName);
  });
});

test("TC19: Open task details popup @workingTests", async ({}) => {
  const taskName = TC19data.payloadCreateTask.subject
  // Search task
  await taskPage.searchTask(taskName);

  // Open task details
  await taskPage.openTaskDetails(taskName);

  // Assertions
  const isTaskDetailsDialogVisible = await taskPage.isTaskDetailsDialogVisible(taskName);
  expect(isTaskDetailsDialogVisible).toBeTruthy();
});

test("TC20: The information table columns should be customizable using the ‘Columns’ button at the top. @workingTests", async ({}) => {

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

test("TC25: Verify the billable status of a billable task. @workingTests ", async ({}) => {
  // Add column to view
  await taskPage.addColumn("Is Billable");

  // Search task
  await taskPage.searchTask(TC25data.payloadCreateTask.subject);

  // Assertions
  const isTaskBillable = await taskPage.isTaskBillable(TC25data.payloadCreateTask.subject);
  expect(isTaskBillable).toBeTruthy();
});

test("TC26: Verify the billable status of a non-billable task. @workingTests ", async ({}) => {
  // Add column to view
  await taskPage.addColumn("Is Billable");

  // Search task
  await taskPage.searchTask(TC26data.payloadCreateTask.subject);

  // Assertions
  const isTaskBillable = await taskPage.isTaskBillable(TC26data.payloadCreateTask.subject);
  expect(isTaskBillable).toBeFalsy();
});
