import path from "path";
import { test, expect } from "@playwright/test";
import { TaskPage } from "../../pageObjects/taskPage";
import data from "../../data/manager/task.json";

let taskPage;

// Load test data
let TC12data = data.TC12;
let TC14data = data.TC14;

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

test("TC12: Validate the search functionality", async ({}) => {
  // Search task
  await taskPage.searchTask(TC12data.task);

  // Assertions
  const filteredTasks = await taskPage.getTasks();
  expect(filteredTasks.length).toBeGreaterThanOrEqual(1);
  filteredTasks.forEach((task) => {
    expect(task).toContain(TC12data.task);
  });
});

test("TC14: Open task details popup", async ({}) => {
  // Search task
  await taskPage.searchTask(TC14data.task);

  // Open task details
  await taskPage.openTaskDetails(TC14data.task);

  // Assertions
  const isTaskDetailsDialogVisible = await taskPage.isTaskDetailsDialogVisible(TC14data.task);
  expect(isTaskDetailsDialogVisible).toBeTruthy();
});
