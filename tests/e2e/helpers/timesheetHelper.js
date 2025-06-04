import path from "path";
import fs from "fs";
import { getWeekdayName, getFormattedDate, getDateForWeekday } from "../utils/dateUtils";
import {
  createTimesheet,
  getTimesheetDetails,
  deleteTimesheet,
  deleteTimesheetbyID,
  submitTimesheet,
} from "../utils/api/timesheetRequests";
import employeeTimesheetData from "../data/employee/timesheet.json";
import managerTeamData from "../data/manager/team.json";
import managerTaskData from "../data/manager/task.json";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { createProject, deleteProject, getProjectDetails } from "../utils/api/projectRequests";
import { createTask, deleteTask, likeTask, updateTask } from "../utils/api/taskRequests";
import { getExchangeRate } from "../utils/api/erpNextRequests";
import { getEmployeeDetails } from "../utils/api/employeeRequests";
import { filterApi, shareProjectWithUser } from "../utils/api/frappeRequests";
import { deleteLeave } from "../utils/api/leaveRequests";
import { getWeekRange } from "../utils/dateUtils";
import { deleteEmployeeByName } from "./employeeHelper";

// Load env variables
const empID = process.env.EMP_ID;
const emp2ID = process.env.EMP2_ID;
const emp3ID = process.env.EMP3_ID;

// Define file paths for shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json"); // File path of the manager team data JSON file
const managerTaskDataFilePath = path.resolve(__dirname, "../data/manager/shared-task.json"); // File path of the manager team data JSON file
const TASK_TRACKER_PATH = path.resolve(__dirname, "../data/manager/tasks-to-delete.json");

// Global variables to store shared data and reused across functions
let sharedEmployeeTimesheetData;
let sharedManagerTeamData;
let sharedManagerTaskData;

// ------------------------------------------------------------------------------------------

/**
 * Updates time entry data for employees by modifying relevant fields dynamically.
 *
 * Adjusts time entry dates based on the current weekday.
 * Updates 'payloadCreateTimesheet' and 'payloadFilterTimeEntry' fields with computed dates and employee ID.
 * Saves the updated data back to the shared JSON files.
 *
 * Test Cases: TC2, TC3, TC4, TC5, TC6, TC7, TC14, TC15, TC47, TC49, TC50, TC82, TC83, TC84, TC85, TC86, TC96, TC97, TC98, TC99, TC100, TC101
 */
export const updateTimeEntries = async () => {
  const employeeTimesheetIDs = [
    "TC2",
    "TC3",
    "TC4",
    "TC5",
    "TC6",
    "TC7",
    "TC14",
    "TC15",
    "TC82",
    "TC83",
    "TC84",
    "TC85",
    "TC86",
    "TC87",
    "TC88",
    "TC89",
    "TC90",
    "TC96",
    "TC97",
    "TC98",
    "TC99",
    "TC100",
    "TC101",
  ];
  const managerTeamIDs = ["TC47", "TC49", "TC50", "TC92"];

  // Compute col value for TC2 before update
  employeeTimesheetData.TC2.cell.col = getWeekdayName(new Date());

  const updateEntries = (data, testCases) => {
    for (const testCaseID of testCases) {
      if (!data[testCaseID]?.cell?.col) continue; // Skip if missing required structure

      const formattedDate = getFormattedDate(getDateForWeekday(data[testCaseID].cell.col));
      const tcEmp3 = new Set(["TC92"]);
      const tcEmp2 = new Set(["TC2"]);

      const employeeID = tcEmp3.has(testCaseID) ? emp3ID : tcEmp2.has(testCaseID) ? emp2ID : empID;

      // Update 'payloadCreateTimesheet' if it exists
      if (data[testCaseID].payloadCreateTimesheet) {
        data[testCaseID].payloadCreateTimesheet.date = formattedDate;
        data[testCaseID].payloadCreateTimesheet.employee = employeeID;
      }

      // Update all 'payloadFilterTimeEntry' fields dynamically
      Object.keys(data[testCaseID])
        .filter((entryKey) => entryKey.startsWith("payloadFilterTimeEntry"))
        .forEach((entryKey) => {
          data[testCaseID][entryKey].from_time = formattedDate;
          data[testCaseID][entryKey].employee = employeeID;
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
 * Test Cases: TC4, TC5, TC6, TC7, TC14, TC15, TC47, TC49, TC50, TC82, TC83, TC84, TC85, TC86, TC96, TC97, TC98, TC99, TC100, TC101
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
    sharedEmployeeTimesheetData.TC82.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC83.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC84.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC85.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC86.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC87.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC88.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC89.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC90.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC96.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC97.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC98.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC99.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC100.payloadCreateTimesheet,
    sharedEmployeeTimesheetData.TC101.payloadCreateTimesheet,
    sharedManagerTeamData.TC47.payloadCreateTimesheet,
    sharedManagerTeamData.TC49.payloadCreateTimesheet,
    sharedManagerTeamData.TC50.payloadCreateTimesheet,
    sharedManagerTeamData.TC92.payloadCreateTimesheet,
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
 * Test Cases: TC2, TC3, TC4, TC5, TC6, TC7, TC14, TC15, TC47, TC49, TC50, TC82, TC83, TC84, TC85, TC86, TC96, TC97, TC98, TC99, TC100, TC101
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
    sharedEmployeeTimesheetData.TC82.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC83.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC84.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC85.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC86.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC87.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC88.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC89.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC90.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC96.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC97.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC98.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC99.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC100.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC101.payloadFilterTimeEntry,
    sharedManagerTeamData.TC47.payloadFilterTimeEntry,
    sharedManagerTeamData.TC49.payloadFilterTimeEntry,
    sharedManagerTeamData.TC50.payloadFilterTimeEntry,
    sharedManagerTeamData.TC92.payloadFilterTimeEntry,
  ];

  for (const entry of timeEntries) {
    const filteredTimeEntry = await filterTimesheetEntry(entry);

    await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name }, "employee");

    if (entry.project_name === "TC02 Project") {
      console.warn(`RESPONSE OF DELETE TIMESHEET FOR TC02 : ${entry.project_name}`);
    }
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
          entry.from_time.includes(from_time)
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
export const createProjectForTestCases = async () => {
  // Include testcase ID's below that require a project to be created
  const employeeTimesheetIDs = [
    "TC2",
    "TC3",
    "TC4",
    "TC5",
    "TC6",
    "TC7",
    "TC9",
    "TC14",
    "TC15",
    "TC82",
    "TC83",
    "TC84",
    "TC85",
    "TC86",
    "TC87",
    "TC88",
    "TC89",
    "TC90",
    "TC96",
    "TC97",
    "TC98",
    "TC99",
    "TC100",
    "TC101",
  ];
  const managerTaskIDs = ["TC22", "TC24", "TC25", "TC26", "TC17", "TC19"];

  const managerTeamIDs = ["TC47", "TC49", "TC50", "TC92", "TC93"];

  const processTestCases = async (data, testCases) => {
    for (const testCaseID of testCases) {
      if (data[testCaseID].payloadCreateProject) {
        const createProjectPayload = data[testCaseID].payloadCreateProject;

        // Store the response of createProject API
        const response = await createProject(createProjectPayload);
        if (!response.ok) {
          console.error(`Failed to create project for ${testCaseID}: ${response.statusText}`);
          continue;
        }

        const jsonResponse = await response.json();

        const projectId = jsonResponse.data.name;
        const custom_currency = jsonResponse.data.custom_currency;

        //Share project with users
        if (data[testCaseID].payloadShareProject) {
          const shareProjectArray = data[testCaseID].payloadShareProject;

          for (const shareProjectWithUserPayload of shareProjectArray) {
            shareProjectWithUserPayload.name = projectId;

            // shareProjectWithUserPayload.user = emp2Mail;

            // console.warn("Payload for sharing project:", shareProjectWithUserPayload);

            await shareProjectWithUser({ ...shareProjectWithUserPayload });

            // Optional: log the response
            // console.warn("Response of share project is:", response);
          }
        }

        // Store project ID in related payloads
        data[testCaseID].payloadDeleteProject.projectId = projectId;

        if (data[testCaseID].payloadCreateTask) {
          data[testCaseID].payloadCreateTask.project = projectId;
        }
        if (data[testCaseID].payloadCalculateBillingRate) {
          data[testCaseID].payloadCalculateBillingRate.project = projectId;
          data[testCaseID].payloadCalculateBillingRate.custom_currency_for_project = custom_currency;
        }
      }
    }
  };

  await processTestCases(employeeTimesheetData, employeeTimesheetIDs);
  await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);

  await processTestCases(managerTaskData, managerTaskIDs);
  await writeDataToFile(managerTaskDataFilePath, managerTaskData);

  await processTestCases(managerTeamData, managerTeamIDs);
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes projects for all the test cases provided in the projectsToBeDeleted array below
 */
export const deleteProjects = async () => {
  sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  sharedManagerTaskData = await readJSONFile("../data/manager/shared-task.json");
  sharedManagerTeamData = await readJSONFile("../data/manager/shared-team.json");
  //Provide the json structure in below array for the testcase that needs Project Deletion
  const projectsToBeDeleted = [
    sharedEmployeeTimesheetData.TC2.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC3.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC4.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC5.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC6.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC7.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC9.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC14.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC15.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC82.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC83.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC84.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC85.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC86.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC87.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC88.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC89.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC90.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC96.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC97.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC98.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC99.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC100.payloadDeleteProject.projectId,
    sharedEmployeeTimesheetData.TC101.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC17.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC19.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC22.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC24.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC25.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC26.payloadDeleteProject.projectId,
    sharedManagerTeamData.TC47.payloadDeleteProject.projectId,
    sharedManagerTeamData.TC49.payloadDeleteProject.projectId,
    sharedManagerTeamData.TC50.payloadDeleteProject.projectId,
    sharedManagerTeamData.TC92.payloadDeleteProject.projectId,
    sharedManagerTeamData.TC93.payloadDeleteProject.projectId,
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
export const createTaskForTestCases = async () => {
  // Include testcase IDs that require a task to be created
  const employeeTimesheetIDs = [
    "TC2",
    "TC3",
    "TC4",
    "TC5",
    "TC6",
    "TC7",
    "TC9",
    "TC14",
    "TC15",
    "TC82",
    "TC83",
    "TC84",
    "TC85",
    "TC86",
    "TC87",
    "TC88",
    "TC89",
    "TC90",
    "TC96",
    "TC97",
    "TC98",
    "TC99",
    "TC100",
    "TC101",
  ];

  const managerTaskIDs = ["TC22", "TC25", "TC26", "TC17", "TC19"];
  const managerTeamIDs = ["TC47", "TC49", "TC50", "TC92"];

  const processTestCasesForTasks = async (data, testCases) => {
    for (const testCaseID of testCases) {
      let taskID;
      let taskSubject;
      if (data[testCaseID].payloadCreateTask) {
        const createTaskPayload = data[testCaseID].payloadCreateTask;

        // Store the response of createTask API
        const response = await createTask(createTaskPayload);
        if (!response || typeof response !== "object") {
          console.error(`Failed to create task for ${testCaseID}: Unexpected response format`);
          continue;
        }

        const jsonResponse = response;
        taskID = jsonResponse.data.name;
        taskSubject = data[testCaseID].payloadCreateTask.subject;

        // Store task ID in related payloads
        data[testCaseID].payloadDeleteTask.taskID = taskID;

        if (data[testCaseID].payloadUpdateTask) {
          const updateTaskPayload = data[testCaseID].payloadUpdateTask;

          await updateTask(taskID, updateTaskPayload);
          //console.log(`UPDATE TASK RESPOSNE FOR ${testCaseID} is : \n ${updateTaskResponse} and custom billable status is ${updateTaskResponse.data.custom_is_billable}`);
        }
      }

      if (data[testCaseID].payloadLikeTask) {
        // Store the task ID for liking the task
        data[testCaseID].payloadLikeTask.name = taskID;
        const response = await likeTask(taskID, data[testCaseID].payloadLikeTask.role);

        if (response && typeof response === "object") {
          console.log(`Successfully liked task for ${testCaseID}`);
        } else {
          console.error(`Failed to like task for ${testCaseID}: Unexpected response format`);
        }

        // Add the subject to TC12 inside tasks array
        if (data.TC12 && Array.isArray(data.TC12.tasks)) {
          data.TC12.tasks.push(taskSubject);
        }
      }

      if (data[testCaseID].payloadCreateTimesheet) {
        // Store the task ID for creating a timesheet
        data[testCaseID].payloadCreateTimesheet.task = taskID;
      }
    }
  };

  await processTestCasesForTasks(employeeTimesheetData, employeeTimesheetIDs);
  await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);

  await processTestCasesForTasks(managerTaskData, managerTaskIDs);
  await writeDataToFile(managerTaskDataFilePath, managerTaskData);

  await processTestCasesForTasks(managerTeamData, managerTeamIDs);
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
};
// ------------------------------------------------------------------------------------------

/**
 * Deletion of tasks by their name that were created though UI
 **/

export const deleteByTaskName = async () => {
  try {
    const tasksToBeDeleted = await readJSONFile(TASK_TRACKER_PATH);

    if (!Array.isArray(tasksToBeDeleted) || tasksToBeDeleted.length === 0) {
      console.warn("No tasks found in the task-tracking file.");
      return;
    }

    for (const taskName of tasksToBeDeleted) {
      console.warn("Checking for task:", taskName);

      const filterResponse = await filterApi("Task", [["Task", "subject", "=", taskName]]);
      console.warn("Response for getting TASK BY NAME IN DELETION OF TASK IS:", filterResponse);

      if (filterResponse.message?.values?.length) {
        const taskID = filterResponse.message.values[0];
        console.log("Task found and ID to delete:", taskID);
        await deleteTask(taskID);
      } else {
        console.log(`Task "${taskName}" not found in system. Skipping...`);
      }
    }

    //Optionally clear the file after deletion
    //fs.writeFileSync(TASK_TRACKER_PATH, JSON.stringify([], null, 2), "utf-8");
    //console.log("Deleted all listed tasks and cleared tracking file.");
  } catch (error) {
    console.error("Error while deleting tasks by name:", error.message);
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes tasks for all the test cases provided in the tasksToBeDeleted array below
 */
export const deleteTasks = async () => {
  sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  sharedManagerTaskData = await readJSONFile("../data/manager/shared-task.json");
  sharedManagerTeamData = await readJSONFile("../data/manager/shared-team.json");

  // List of test case entries with test case IDs
  const tasksToBeDeleted = [
    { id: "TC2", data: sharedEmployeeTimesheetData.TC2 },
    { id: "TC3", data: sharedEmployeeTimesheetData.TC3 },
    { id: "TC4", data: sharedEmployeeTimesheetData.TC4 },
    { id: "TC5", data: sharedEmployeeTimesheetData.TC5 },
    { id: "TC6", data: sharedEmployeeTimesheetData.TC6 },
    { id: "TC7", data: sharedEmployeeTimesheetData.TC7 },
    { id: "TC9", data: sharedEmployeeTimesheetData.TC9 },
    { id: "TC14", data: sharedEmployeeTimesheetData.TC14 },
    { id: "TC15", data: sharedEmployeeTimesheetData.TC15 },
    { id: "TC82", data: sharedEmployeeTimesheetData.TC82 },
    { id: "TC83", data: sharedEmployeeTimesheetData.TC83 },
    { id: "TC84", data: sharedEmployeeTimesheetData.TC84 },
    { id: "TC85", data: sharedEmployeeTimesheetData.TC85 },
    { id: "TC86", data: sharedEmployeeTimesheetData.TC86 },
    { id: "TC87", data: sharedEmployeeTimesheetData.TC87 },
    { id: "TC88", data: sharedEmployeeTimesheetData.TC88 },
    { id: "TC89", data: sharedEmployeeTimesheetData.TC89 },
    { id: "TC90", data: sharedEmployeeTimesheetData.TC90 },
    { id: "TC96", data: sharedEmployeeTimesheetData.TC96 },
    { id: "TC97", data: sharedEmployeeTimesheetData.TC97 },
    { id: "TC98", data: sharedEmployeeTimesheetData.TC98 },
    { id: "TC99", data: sharedEmployeeTimesheetData.TC99 },
    { id: "TC100", data: sharedEmployeeTimesheetData.TC100 },
    { id: "TC101", data: sharedEmployeeTimesheetData.TC101 },
    { id: "TC22", data: sharedManagerTaskData.TC22 },
    { id: "TC25", data: sharedManagerTaskData.TC25 },
    { id: "TC26", data: sharedManagerTaskData.TC26 },
    { id: "TC17", data: sharedManagerTaskData.TC17 },
    { id: "TC19", data: sharedManagerTaskData.TC19 },
    { id: "TC47", data: sharedManagerTeamData.TC47 },
    { id: "TC49", data: sharedManagerTeamData.TC49 },
    { id: "TC50", data: sharedManagerTeamData.TC50 },
    { id: "TC92", data: sharedManagerTeamData.TC92 },
  ];

  // For admin to delete a TC task
  const adminCases = new Set(["TC2", "TC92"]);
  for (const { id, data } of tasksToBeDeleted) {
    if (adminCases.has(id)) {
      await deleteTask(data.payloadDeleteTask.taskID, "admin");
    } else {
      await deleteTask(data.payloadDeleteTask.taskID);
    }
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Calculates hourly billing rate of employee and billing rate of a project
 */
export const calculateHourlyBilling = async () => {
  const employeeTimesheetIDs = ["TC82", "TC83", "TC84", "TC85", "TC86", "TC87", "TC88", "TC89", "TC90"];
  let monthly_billing_rate;
  let hourly_billing_rate;
  let employee_currency, project_currency, employee_CTC, convertedCTC;

  const hourly_billing_rate_for_project = async (data, testCases) => {
    for (const testCaseID of testCases) {
      if (data[testCaseID].payloadCalculateBillingRate) {
        // Get Employee Salary : Currency
        const response = await getEmployeeDetails(empID, "admin");

        employee_CTC = response.data.ctc;
        employee_currency = response.data.salary_currency;
        project_currency = data[testCaseID].payloadCalculateBillingRate.custom_currency_for_project;

        //If the employee currency and project currency differs
        if (employee_currency !== project_currency) {
          //convert the employee currency value to project currency value
          const responseOfConvertCurrency = await getExchangeRate(employee_currency, project_currency);
          //Calculate the CTC acording to project currency value
          convertedCTC = responseOfConvertCurrency.message * employee_CTC;
          monthly_billing_rate = convertedCTC / 12;
          hourly_billing_rate = monthly_billing_rate / 160;
        } else {
          monthly_billing_rate = employee_CTC / 12;
          hourly_billing_rate = monthly_billing_rate / 160;
        }

        const responseOfProjectdetails = await getProjectDetails(data[testCaseID].payloadCalculateBillingRate.project);
        const jsonResponseOfProjectDetials = await responseOfProjectdetails.json();
        const total_billable_amount = jsonResponseOfProjectDetials.data.total_billable_amount;
        const total_costing_amount = jsonResponseOfProjectDetials.data.total_costing_amount;

        //Store the Total Billable amount
        data[testCaseID].payloadCalculateBillingRate.total_billable_amount = total_billable_amount;

        //Store the Total Costing amount
        data[testCaseID].payloadCalculateBillingRate.total_costing_amount = total_costing_amount;

        //Store the hourly billing rate
        data[testCaseID].payloadCalculateBillingRate.hourly_billing_rate = hourly_billing_rate;
      }
    }
  };

  await hourly_billing_rate_for_project(employeeTimesheetData, employeeTimesheetIDs);

  await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);
};
// ------------------------------------------------------------------------------------------

/**
 * Delete all the leaves,tasks and time entries associated with the project and delete the project itself
 */
export const cleanUpProjects = async (data) => {
  const deletedData = [];

  for (const key in data) {
    const tc = data[key];

    // Check if payloadCreateProject exists and project_name is valid
    if (!tc.payloadCreateProject || !tc.payloadCreateProject.project_name) continue;

    const projectName = tc.payloadCreateProject.project_name;

    // Get Project ID
    const projectRes = await filterApi("Project", [["Project", "project_name", "=", projectName]]);
    const projectId = projectRes?.message?.values?.[0]?.[0];

    if (!projectId) {
      continue;
    } else if (projectId && projectId !== undefined) {
      console.warn(`\n Obtained ProjectId value for ${key} is       ; `, projectId);
    }

    // Get Task IDs
    const taskRes = await filterApi("Task", [["Task", "project", "=", projectId]]);

    const taskRaw = taskRes?.message?.values;
    let taskIds = [];

    if (Array.isArray(taskRaw)) {
      taskIds = taskRaw.map((v) => v[0]);
      console.warn(`OBTAINED TASK for ${key} is: `, taskIds);
    } else {
      console.warn(`No tasks found for project ${key}. Skipping task deletion.`);
    }

    // Get Timesheet IDs
    const timesheetRes = await filterApi("Timesheet", [["Timesheet", "parent_project", "=", projectId]], "admin");
    //console.warn(`TMESHEET RESPONSE for ${key} is ; `, timesheetRes);

    const valuesRaw = timesheetRes?.message?.values;
    //console.warn(`Actual values for ${key}:`, valuesRaw);
    //console.warn(`Type of values:`, typeof valuesRaw);
    //console.warn(`Is Array:`, Array.isArray(valuesRaw));

    const timesheetValues = timesheetRes?.message?.values || [];
    if (Array.isArray(timesheetValues) && timesheetValues.length > 0) {
      console.warn(`OBTAINED TIMESHEET ID FOR ${key} is ; `, timesheetValues);
    }

    let timesheetIds = [];

    if (Array.isArray(valuesRaw)) {
      // Flatten and filter valid strings only
      timesheetIds = valuesRaw.flat().filter((v) => typeof v === "string");
    }

    //console.warn(`TIMESHEET IDs to delete:`, timesheetIds);

    // Store collected info
    deletedData.push({
      projectId,
      timesheetIds,
      taskIds,
    });

    // Delete Timesheets
    for (const timesheetId of timesheetIds) {
      if (!timesheetId || typeof timesheetId !== "string") {
        console.error(`Invalid timesheetId encountered:`, timesheetId);
        continue;
      }

      try {
        console.log(`Deleting Timesheet: ${timesheetId}`);
        await deleteTimesheetbyID(timesheetId, "admin");
      } catch (err) {
        console.error(` Failed to delete timesheet ${timesheetId}:`, err.message);
      }
    }

    // Delete Tasks
    for (const taskId of taskIds) {
      await deleteTask(taskId);
    }

    // Delete Project
    if (projectId) {
      await deleteProject(projectId);
    }
  }

  console.log("Cleanup complete. Deleted data:", deletedData);
  return deletedData;
};
// ------------------------------------------------------------------------------------------

/**
 * Delete Leaves associated to an employee
 */
export const deleteLeaveOfEmployee = async () => {
  //Fetch Leave ID for employee if any exists
  const filterResponse = await filterApi("Leave Application", [
    ["Leave Application", "employee", "=", `${emp2ID}`],
    ["Leave Application", "status", "=", "Open"],
  ]);
  //Delete leave if leave ID is found in the filter request
  if (filterResponse?.message?.values[0]) {
    const leaveID = filterResponse.message.values[0];
    await deleteLeave(leaveID);
    console.warn("A leave request for employee was found and deleted");
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Combined json files to pass for deleting the orphan test data
 */
export const readAndCleanAllOrphanData = async () => {
  const employeeData = await readJSONFile("../data/employee/timesheet.json");
  const managerTask = await readJSONFile("../data/manager/task.json");
  const managerTeam = await readJSONFile("../data/manager/team.json");

  const mergedData = {
    ...employeeData,
    ...managerTask,
    ...managerTeam,
  };
  await deleteLeaveOfEmployee();
  await deleteEmployeeByName();
  await cleanUpProjects(mergedData);
};
/**
 * Submits timesheet for Approval for an employee
 */
export const submitTimesheetForApproval = async (empId, managerID, role) => {
  //Get timesheetId for current week for the empID
  const { monday, friday } = getWeekRange();

  await submitTimesheet(
    {
      start_date: monday,
      end_date: friday,
      notes: "submit for approval through emp API",
      approver: managerID,
      employee: empId,
    },
    (role = role)
  );
};
