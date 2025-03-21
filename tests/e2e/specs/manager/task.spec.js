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
