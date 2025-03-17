import path from "path";
import { test, expect } from "@playwright/test";
import { TaskPage } from "../../pageObjects/taskPage";
import data from "../../data/manager/task.json";

let taskPage;

// Load test data
let TC17data = data.TC17;
let TC19data = data.TC19;

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
