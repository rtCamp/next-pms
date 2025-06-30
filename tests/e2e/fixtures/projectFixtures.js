import { test as baseTest } from "@playwright/test";
import path from "path";
import initialEmployeeTimesheetData from "../data/employee/timesheet.js";
import initialManagerTaskData from "../data/manager/task.js";
import initialManagerTeamData from "../data/manager/team.js";
import { createProject, shareProjectWithUser, deleteProject } from "../utils/api/projectRequests.js";
import { writeDataToFile, readJSONFile } from "../utils/fileUtils.js";

// Define file paths for shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json");
const managerTaskDataFilePath = path.resolve(__dirname, "../data/manager/shared-task.json");
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json");

export const test = baseTest.extend({
  // override testCaseIDs (default = empty array, optional)
  testCaseIDs: [[], { option: true }],

  projectData: async ({ testCaseIDs }, use) => {
    // Deep clone initial data
    const employeeTimesheetData = JSON.parse(JSON.stringify(initialEmployeeTimesheetData));
    const managerTaskData = JSON.parse(JSON.stringify(initialManagerTaskData));
    const managerTeamData = JSON.parse(JSON.stringify(initialManagerTeamData));

    // Helper to process creation for given data and IDs
    const processTestCases = async (data, testCases) => {
      for (const id of testCases) {
        const tc = data[id];
        if (!tc || !tc.payloadCreateProject) continue;

        // Create project
        const response = await createProject(tc.payloadCreateProject);
        if (!response.ok) {
          console.error(`❌ Failed to create project for ${id}:`, response.statusText);
          continue;
        }
        const json = await response.json();
        const projectId = json.data.name;
        const customCurrency = json.data.custom_currency;

        // Share project if payload provided
        if (tc.payloadShareProject) {
          for (const sharePayload of tc.payloadShareProject) {
            sharePayload.name = projectId;
            await shareProjectWithUser({ ...sharePayload });
          }
        }

        // Store IDs back into payloads
        if (tc.payloadDeleteProject) {
          tc.payloadDeleteProject.projectId = projectId;
        } else {
          console.error(`❌ Missing payloadDeleteProject for ${id}`);
        }
        if (tc.payloadCreateTask) {
          tc.payloadCreateTask.project = projectId;
        }
        if (tc.payloadCalculateBillingRate) {
          tc.payloadCalculateBillingRate.project = projectId;
          tc.payloadCalculateBillingRate.custom_currency_for_project = customCurrency;
        }
      }
    };

    // Determine IDs per data set
    const employeeIDs = testCaseIDs.filter((id) => id in employeeTimesheetData);
    const managerTaskIDs = testCaseIDs.filter((id) => id in managerTaskData);
    const managerTeamIDs = testCaseIDs.filter((id) => id in managerTeamData);

    // Create for each category
    await processTestCases(employeeTimesheetData, employeeIDs);
    await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);

    await processTestCases(managerTaskData, managerTaskIDs);
    await writeDataToFile(managerTaskDataFilePath, managerTaskData);

    await processTestCases(managerTeamData, managerTeamIDs);
    await writeDataToFile(managerTeamDataFilePath, managerTeamData);

    // Expose data to tests so they can access the created project details
    // Tests can access the returned object as projectData.employeeTimesheetData, etc.
    await use({ employeeTimesheetData, managerTaskData, managerTeamData });

    // Teardown: delete created projects
    const sharedEmployee = await readJSONFile(employeeTimesheetDataFilePath);
    const sharedTask = await readJSONFile(managerTaskDataFilePath);
    const sharedTeam = await readJSONFile(managerTeamDataFilePath);

    const projectsToDelete = [];
    for (const id of testCaseIDs) {
      const projE = sharedEmployee[id]?.payloadDeleteProject?.projectId;
      const projT = sharedTask[id]?.payloadDeleteProject?.projectId;
      const projM = sharedTeam[id]?.payloadDeleteProject?.projectId;
      if (projE) projectsToDelete.push(projE);
      if (projT) projectsToDelete.push(projT);
      if (projM) projectsToDelete.push(projM);
    }

    for (const projectId of projectsToDelete) {
      try {
        await deleteProject(projectId);
      } catch (e) {
        console.warn(`⚠️ Failed to delete project ${projectId}:`, e);
      }
    }
  },
});

export const expect = test.expect;
