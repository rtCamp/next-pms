import path from "path";
import fs from "fs";
import { getWeekdayName, getFormattedDate, getDateForWeekday } from "../utils/dateUtils";
import { createTimesheet, getTimesheetDetails, deleteTimesheet } from "../utils/api/timesheetRequests";
import employeeTimesheetData from "../data/employee/timesheet.json";
import managerTeamData from "../data/manager/team.json";
import { readJSONFile } from "../utils/fileUtils";
import { createProject, deleteProject } from "../utils/api/projectRequests";
import { createTask, deleteTask, likeTask } from "../utils/api/taskRequests";

// Load env variables
const empID = process.env.EMP_ID;

// Define file paths for shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json"); // File path of the manager team data JSON file

// Global variables to store shared data and reused across functions
let sharedEmployeeTimesheetData;
let sharedManagerTeamData;

// ------------------------------------------------------------------------------------------

/**
 * Updates time entry data for employees by modifying relevant fields dynamically.
 *
 * Adjusts time entry dates based on the current weekday.
 * Updates 'payloadCreateTimesheet' and 'payloadFilterTimeEntry' fields with computed dates and employee ID.
 * Saves the updated data back to the shared JSON files.
 *
 * Test Cases: TC2, TC3, TC4, TC5, TC6, TC7, TC14, TC15, TC47, TC49
 */
export const updateTimeEntries = async () => {
  const employeeTimesheetIDs = ["TC2", "TC3", "TC4", "TC5", "TC6", "TC7", "TC14", "TC15"];
  const managerTeamIDs = ["TC47", "TC49"];

  // Compute col value for TC2 before update
  employeeTimesheetData.TC2.cell.col = getWeekdayName(new Date());

  const updateEntries = (data, testCases) => {
    for (const testCaseID of testCases) {
      if (!data[testCaseID]?.cell?.col) continue; // Skip if missing required structure

      const formattedDate = getFormattedDate(getDateForWeekday(data[testCaseID].cell.col));

      // Update 'payloadCreateTimesheet' if it exists
      if (data[testCaseID].payloadCreateTimesheet) {
        data[testCaseID].payloadCreateTimesheet.date = formattedDate;
        data[testCaseID].payloadCreateTimesheet.employee = empID;
      }

      // Update all 'payloadFilterTimeEntry' fields dynamically
      Object.keys(data[testCaseID])
        .filter((entryKey) => entryKey.startsWith("payloadFilterTimeEntry"))
        .forEach((entryKey) => {
          data[testCaseID][entryKey].from_time = formattedDate;
          data[testCaseID][entryKey].employee = empID;
        });
    }
  };

  updateEntries(employeeTimesheetData, employeeTimesheetIDs);
  updateEntries(managerTeamData, managerTeamIDs);

  // Write updated data to shared JSON files
  fs.writeFileSync(employeeTimesheetDataFilePath, JSON.stringify(employeeTimesheetData, null, 2));
  fs.writeFileSync(managerTeamDataFilePath, JSON.stringify(managerTeamData, null, 2));
};

// ------------------------------------------------------------------------------------------

/**
 * Creates initial time entries for employees from
 * the shared employee and manager timesheet data.
 *
 * This function iterates over predefined time entry payloads and submits them
 * to create timesheet records.
 *
 * Test Cases: TC4, TC5, TC6, TC7, TC14, TC15, TC47, TC49
 */
export const createTimeEntries = async () => {
  sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  sharedManagerTeamData = await readJSONFile("../data/manager/shared-team.json");
  const timeEntries = [
    sharedEmployeeTimesheetData.TC4.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC5.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC6.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC7.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC14.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC15.payloadCreateTimesheet,
    sharedManagerTeamData.TC47.payloadCreateTimesheet,
    sharedManagerTeamData.TC49.payloadCreateTimesheet,
  ];

  for (const entry of timeEntries) {
    await createTimesheet(entry);
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes stale time entries from the shared employee and manager timesheet data.
 *
 * This function reads timesheet data from JSON files and iterates through predefined
 * time entry objects, filtering each entry and deleting the corresponding timesheet record.
 *
 * Test Cases: TC2, TC3, TC4, TC5, TC6, TC7, TC14, TC15, TC47, TC49
 */
export const deleteTimeEntries = async () => {
  sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  sharedManagerTeamData = await readJSONFile("../data/manager/shared-team.json");
  const timeEntries = [
    sharedEmployeeTimesheetData.TC2.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC3.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC4.payloadFilterTimeEntry1,
    sharedEmployeeTimesheetData.TC4.payloadFilterTimeEntry2,
    sharedEmployeeTimesheetData.TC5.payloadFilterTimeEntry1,
    sharedEmployeeTimesheetData.TC5.payloadFilterTimeEntry2,
    sharedEmployeeTimesheetData.TC6.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC7.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC14.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC15.payloadFilterTimeEntry,
    sharedManagerTeamData.TC47.payloadFilterTimeEntry,
    sharedManagerTeamData.TC49.payloadFilterTimeEntry,
  ];

  for (const entry of timeEntries) {
    const filteredTimeEntry = await filterTimesheetEntry(entry);
    await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Filters timesheet entries and returns the metadata of the matching time entry.
 *
 * Optional params: start_date, max_week.
 */
export const filterTimesheetEntry = async ({ subject, description, project_name, from_time, employee, max_week }) => {
  const payload = { employee, start_date: from_time, max_week };
  const response = await getTimesheetDetails(payload);
  const jsonResponse = await response.json();
  const data = jsonResponse.message.data;

  // Iterate over all weeks
  for (const weekData of Object.values(data)) {
    // Extract and iterate over all tasks
    for (const taskMetaData of Object.values(weekData.tasks)) {
      if (taskMetaData.subject !== subject) continue;

      // Find the first matching entry
      const matchingEntry = taskMetaData.data.find(
        (entry) =>
          entry.description === description &&
          entry.project_name === project_name &&
          entry.from_time.includes(from_time),
      );

      // Return the matching entry
      if (matchingEntry) return matchingEntry;
    }
  }

  return {}; // Return empty object if no match is found
};
// ------------------------------------------------------------------------------------------

/**
 * Creates projects for all the test cases provided in the employeeTimesheetIDs array below
 */
export const createProjects = async () => {
  //Include testcase ID's below that require project to be created
  const employeeTimesheetIDs = ["TC2", "TC4", "TC5"];

  const createProjects = async (data, testCases) => {
    for (const testCaseID of testCases) {
      if (data[testCaseID].payloadCreateProject) {
        const createProjectPayload = data[testCaseID].payloadCreateProject;
        //Store the response of createProject API
        const response = await createProject(createProjectPayload);
        const jsonResponse = await response.json();
        const projectId = jsonResponse.data.name;
        //Provide the project ID to be stored in payloadDeleteProject and payloadCreateTask
        data[testCaseID].payloadDeleteProject.projectId = projectId;

        if (data[testCaseID].payloadCreateTask) {
          data[testCaseID].payloadCreateTask.project = projectId;
        }
      }
    }
  };
  await createProjects(employeeTimesheetData, employeeTimesheetIDs);
  // Write updated data to shared JSON files
  fs.writeFileSync(employeeTimesheetDataFilePath, JSON.stringify(employeeTimesheetData, null, 2));
};
// ------------------------------------------------------------------------------------------

/**
 * Deletes projects for all the test cases provided in the projectsToBeDeleted array below
 */
export const deleteProjects = async () => {
  sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  //Provide the json structure in below array for the testcase that needs Project Deletion
  const projectsToBeDeleted = [
    sharedEmployeeTimesheetData.TC2.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC4.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC5.payloadDeleteProject.projectId,
  ];
  for (const entry of projectsToBeDeleted) {
    //Delete Project
    await deleteProject(entry);
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Creates tasks for all the test cases provided in the employeeTimesheetIDs array below
 */
export const createTasks = async () => {
  //Include testcase ID's below that require project to be created
  const employeeTimesheetIDs = ["TC2", "TC4", "TC5"];
  let taskID;

  const createTasks = async (data, testCases) => {
    for (const testCaseID of testCases) {
      if (data[testCaseID].payloadCreateTask) {
        const createTaskPayload = data[testCaseID].payloadCreateTask;

        //Store the response of createProject API
        const response = await createTask(createTaskPayload);

        const jsonResponse = await response.json();

        taskID = jsonResponse.data.name;
        //Provide the taskID to be stored in payloadDeleteProject and payloadCreateTask
        data[testCaseID].payloadDeleteTask.taskID = taskID;
      }
      if (data[testCaseID].payloadLikeTask) {
        await likeTask(taskID);
      }
      if (data[testCaseID].payloadCreateTimesheet) {
        data[testCaseID].payloadCreateTimesheet.task = taskID;
      }
    }
  };
  await createTasks(employeeTimesheetData, employeeTimesheetIDs);
  // Write updated data to shared JSON files
  fs.writeFileSync(employeeTimesheetDataFilePath, JSON.stringify(employeeTimesheetData, null, 2));
};
// ------------------------------------------------------------------------------------------

/**
 * Deletes tasks for all the test cases provided in the tasksToBeDeleted array below
 */
export const deleteTasks = async () => {
  sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  //Provide the json structure in below array for the testcase that needs Task Deletion
  const tasksToBeDeleted = [
    sharedEmployeeTimesheetData.TC2.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC4.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC5.payloadDeleteTask.taskID,
  ];
  for (const entry of tasksToBeDeleted) {
    //Delete Project
    await deleteTask(entry);
  }
};
