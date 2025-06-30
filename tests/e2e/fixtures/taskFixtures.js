import { test as baseTest } from "@playwright/test";
import path from "path";
import initialEmployeeTimesheetData from "../data/employee/timesheet.js";
import initialManagerTaskData from "../data/manager/task.js";
import initialManagerTeamData from "../data/manager/team.js";
import { createTask, updateTask, likeTask, deleteTask } from "../utils/api/taskRequests.js";
import { writeDataToFile, readJSONFile } from "../utils/fileUtils.js";

// Paths to shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json");
const managerTaskDataFilePath = path.resolve(__dirname, "../data/manager/shared-task.json");
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json");

export const test = baseTest.extend({
  // override testCaseIDs (default empty array)
  testCaseIDs: [[], { option: true }],

  taskData: async ({ testCaseIDs }, use) => {
    // Deep clone the initial datasets
    const employeeTimesheetData = JSON.parse(JSON.stringify(initialEmployeeTimesheetData));
    const managerTaskData = JSON.parse(JSON.stringify(initialManagerTaskData));
    const managerTeamData = JSON.parse(JSON.stringify(initialManagerTeamData));

    // Helper to create/update/like tasks for given data and IDs
    const processTestCasesForTasks = async (data, testCases) => {
      for (const id of testCases) {
        const tc = data[id];
        if (!tc) continue;

        let taskID;
        let taskSubject;

        // Create a new task if payload provided
        if (tc.payloadCreateTask) {
          const response = await createTask(tc.payloadCreateTask);
          if (!response || typeof response !== "object") {
            console.error(`❌ Failed to create task for ${id}: Invalid response`);
            continue;
          }
          taskID = response.data.name;
          taskSubject = tc.payloadCreateTask.subject;
          // Store delete ID
          tc.payloadDeleteTask = tc.payloadDeleteTask || {};
          tc.payloadDeleteTask.taskID = taskID;

          // Optional update
          if (tc.payloadUpdateTask) {
            await updateTask(taskID, tc.payloadUpdateTask);
          }
        }

        // Like the task if configured
        if (tc.payloadLikeTask && taskID) {
          tc.payloadLikeTask.name = taskID;
          await likeTask(taskID, tc.payloadLikeTask.role);
          if (response && typeof response === "object") {
            console.log(`Successfully liked task for ${tc}`);
          } else {
            console.error(`Failed to like task for ${tc}: Unexpected response format`);
          }
          // Optionally record in TC12 tasks list
          if (data.TC12 && Array.isArray(data.TC12.tasks)) {
            data.TC12.tasks.push(taskSubject);
          }
        }

        // Prepare timesheet payload linkage
        if (tc.payloadCreateTimesheet && taskID) {
          tc.payloadCreateTimesheet.task = taskID;
        }
      }
    };

    // Filter IDs per dataset
    const employeeIDs = testCaseIDs.filter((id) => id in employeeTimesheetData);
    const managerTaskIDs = testCaseIDs.filter((id) => id in managerTaskData);
    const managerTeamIDs = testCaseIDs.filter((id) => id in managerTeamData);

    // Setup: create tasks and update payloads
    await processTestCasesForTasks(employeeTimesheetData, employeeIDs);
    await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);

    await processTestCasesForTasks(managerTaskData, managerTaskIDs);
    await writeDataToFile(managerTaskDataFilePath, managerTaskData);

    await processTestCasesForTasks(managerTeamData, managerTeamIDs);
    await writeDataToFile(managerTeamDataFilePath, managerTeamData);

    // Expose to tests
    await use({ employeeTimesheetData, managerTaskData, managerTeamData });

    // Teardown: delete created tasks
    const sharedEmployee = await readJSONFile(employeeTimesheetDataFilePath);
    const sharedTask = await readJSONFile(managerTaskDataFilePath);
    const sharedTeam = await readJSONFile(managerTeamDataFilePath);

    // IDs requiring admin deletion
    const adminCases = new Set(["TC2", "TC92"]);
    const allIDs = [...employeeIDs, ...managerTaskIDs, ...managerTeamIDs];
    for (const id of allIDs) {
      const projData =
        sharedEmployee[id]?.payloadDeleteTask || sharedTask[id]?.payloadDeleteTask || sharedTeam[id]?.payloadDeleteTask;
      const taskID = projData?.taskID;
      if (!taskID) continue;
      try {
        if (adminCases.has(id)) {
          await deleteTask(taskID, "admin");
        } else {
          await deleteTask(taskID);
        }
      } catch (e) {
        console.warn(`⚠️ Failed to delete task ${taskID} for ${id}:`, e);
      }
    }
  },
});

export const expect = test.expect;
