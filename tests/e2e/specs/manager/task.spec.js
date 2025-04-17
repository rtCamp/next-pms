import path from "path";
import { test as base, expect } from "@playwright/test";
import { TaskPage } from "../../pageObjects/taskPage";
import data from "../../data/manager/task.json";
import sharedData from "../../data/manager/shared-task.json";

// Extend base test with storage states
const testWithEmployee = base.extend({});
const testWithManager = base.extend({});

testWithEmployee.use({ storageState: path.resolve(__dirname, "../../auth/employee.json") });
testWithManager.use({ storageState: path.resolve(__dirname, "../../auth/manager.json") });

// Shared task page instance
/** @type {TaskPage} */
let taskPage;

// Shared beforeEach
const sharedBeforeEach = async ({ page }) => {
  taskPage = new TaskPage(page);
  await taskPage.goto();
};

// Attach shared beforeEach to both test suites
testWithEmployee.beforeEach(sharedBeforeEach);
testWithManager.beforeEach(sharedBeforeEach);

// Test data
const TC17data = data.TC17;
const TC19data = data.TC19;
const TC20data = data.TC20;
const TC22data = sharedData.TC22;
const TC24data = data.TC24;
const TC25data = data.TC25;
const TC26data = data.TC26;

// ─────────────────────────────
// Tests for Employee
// ─────────────────────────────

testWithEmployee("TC17: Validate the search functionality", async () => {
  const taskName = TC17data.payloadCreateTask.subject;
  await taskPage.searchTask(taskName);
  const filteredTasks = await taskPage.getTasks();
  expect(filteredTasks.length).toBeGreaterThanOrEqual(1);
  filteredTasks.forEach((task) => expect(task).toContain(taskName));
});

testWithEmployee("TC19: Open task details popup", async () => {
  const taskName = TC19data.payloadCreateTask.subject;
  await taskPage.searchTask(taskName);
  await taskPage.openTaskDetails(taskName);
  const isVisible = await taskPage.isTaskDetailsDialogVisible(taskName);
  expect(isVisible).toBeTruthy();
});

testWithEmployee("TC22: A task like/favourite functionality", async () => {
  const taskName = TC22data.payloadCreateTask.subject;
  const taskID = TC22data.payloadLikeTask.name;
  await taskPage.searchTask(taskName);
  await taskPage.assertTaskIsLiked(taskID);
});

testWithEmployee("TC25: Verify the billable status of a billable task", async () => {
  await taskPage.addColumn("Is Billable");
  await taskPage.searchTask(TC25data.payloadCreateTask.subject);
  const isBillable = await taskPage.isTaskBillable(TC25data.payloadCreateTask.subject);
  expect(isBillable).toBeTruthy();
});

testWithEmployee("TC26: Verify the billable status of a non-billable task", async () => {
  await taskPage.addColumn("Is Billable");
  await taskPage.searchTask(TC26data.payloadCreateTask.subject);
  const isBillable = await taskPage.isTaskBillable(TC26data.payloadCreateTask.subject);
  expect(isBillable).toBeFalsy();
});

// ─────────────────────────────
// Tests for Manager
// ─────────────────────────────

testWithManager("TC20: Table columns should be customizable", async () => {
  if (await taskPage.isColumnPresent(TC20data.col)) {
    await taskPage.removeColumn(TC20data.col);
    await taskPage.saveView();
  }
  await taskPage.addColumn(TC20data.col);
  await taskPage.saveView();

  await taskPage.goto();
  const isCol1 = await taskPage.isColumnPresent(TC20data.col);

  await taskPage.removeColumn(TC20data.col);
  await taskPage.saveView();

  await taskPage.goto();
  const isCol2 = await taskPage.isColumnPresent(TC20data.col);

  expect(isCol1).toBeTruthy();
  expect(isCol2).toBeFalsy();
});

testWithManager("TC24: Verify task addition", async () => {
  await taskPage.AddTask(TC24data.taskInfo);
  await taskPage.searchTask(TC24data.taskInfo.task);
  await taskPage.openTaskDetails(TC24data.taskInfo.task);
  const isVisible = await taskPage.isTaskDetailsDialogVisible(TC24data.taskInfo.task);
  expect(isVisible).toBeTruthy();
});
