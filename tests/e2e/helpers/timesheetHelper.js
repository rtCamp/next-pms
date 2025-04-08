import path from "path";
import fs from "fs";
import { getWeekdayName, getFormattedDate, getDateForWeekday } from "../utils/dateUtils";
import { createTimesheet, getTimesheetDetails, deleteTimesheet } from "../utils/api/timesheetRequests";
import employeeTimesheetData from "../data/employee/timesheet.json";
import managerTeamData from "../data/manager/team.json";
import managerTaskData from "../data/manager/task.json";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { createProject, deleteProject, getProjectDetails } from "../utils/api/projectRequests";
import { createTask, deleteTask, likeTask } from "../utils/api/taskRequests";
import { getExchangeRate } from "../utils/api/erpNextHelpers";
import { getEmployeeDetails } from "../utils/api/employeeRequests";

// Load env variables
const empID = process.env.EMP_ID;

// Define file paths for shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json"); // File path of the manager team data JSON file
const managerTaskDataFilePath = path.resolve(__dirname, "../data/manager/shared-task.json"); // File path of the manager team data JSON file

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
 * Test Cases: TC2, TC3, TC4, TC5, TC6, TC7, TC14, TC15, TC47, TC49
 */
export const updateTimeEntries = async () => {
  const employeeTimesheetIDs = [
    "TC2", "TC3", "TC4", "TC5", "TC6", "TC7", "TC14", "TC15","TC84"

  ];
  const managerTeamIDs = [
     "TC47", "TC49"
  ];

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
    sharedEmployeeTimesheetData.TC84.payloadCreateTimesheet,
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
    sharedEmployeeTimesheetData.TC84.payloadFilterTimeEntry,
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
    "TC2", "TC3", "TC4", "TC5", "TC6", "TC7", "TC9", "TC14", "TC15","TC84"
  
  ];
  const managerTaskIDs = [
    "TC25", "TC26", "TC17", "TC19"
  ];

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
  writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);

  await processTestCases(managerTaskData, managerTaskIDs);
  writeDataToFile(managerTaskDataFilePath, managerTaskData);
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes projects for all the test cases provided in the projectsToBeDeleted array below
 */
export const deleteProjects = async () => {
  sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  sharedManagerTaskData = await readJSONFile("../data/manager/shared-task.json");
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
    sharedEmployeeTimesheetData.TC84.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC17.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC19.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC25.payloadDeleteProject.projectId,
    sharedManagerTaskData.TC26.payloadDeleteProject.projectId,
    
    
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
    "TC2", "TC3", "TC4", "TC5", "TC6", "TC7", "TC9", "TC14", "TC15","TC84"
    
  ];

  const managerTaskIDs = [
    //"TC25", "TC26", "TC17", "TC19"
  ];

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
      }

      if (data[testCaseID].payloadLikeTask) {
        // Store the task ID for liking the task
        data[testCaseID].payloadLikeTask.name = taskID;
        const response = await likeTask(taskID, data[testCaseID].payloadLikeTask.role);

        if (response && typeof response === "object") {
          console.log(`Successfully liked task for ${testCaseID}:`, response);
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
  writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);

  await processTestCasesForTasks(managerTaskData, managerTaskIDs);
  writeDataToFile(managerTaskDataFilePath, managerTaskData);
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes tasks for all the test cases provided in the tasksToBeDeleted array below
 */
export const deleteTasks = async () => {
  sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  sharedManagerTaskData = await readJSONFile("../data/manager/shared-task.json");

  //Provide the json structure in below array for the testcase that needs Task Deletion
  const tasksToBeDeleted = [
    
    sharedEmployeeTimesheetData.TC2.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC3.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC4.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC5.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC6.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC7.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC9.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC14.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC15.payloadDeleteTask.taskID,
    sharedEmployeeTimesheetData.TC84.payloadDeleteTask.taskID,
    sharedManagerTaskData.TC25.payloadDeleteTask.taskID,
    sharedManagerTaskData.TC26.payloadDeleteTask.taskID,
    sharedManagerTaskData.TC17.payloadDeleteTask.taskID,
    sharedManagerTaskData.TC19.payloadDeleteTask.taskID,
    
    
  ];
  for (const entry of tasksToBeDeleted) {
    //Delete Project
    await deleteTask(entry);
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Calculates hourly billing rate of employee and billing rate of a project
 */
export const calculateHourlyBilling = async () => {
  const employeeTimesheetIDs = ["TC84"];
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
        const project_costing_amount = jsonResponseOfProjectDetials.data.total_costing_amount;

        //Store the project costing amount
        data[testCaseID].payloadCalculateBillingRate.total_costing_amount = project_costing_amount;

        //Store the hourly billing rate
        data[testCaseID].payloadCalculateBillingRate.hourly_billing_rate = hourly_billing_rate;
      }
    }
  };

  await hourly_billing_rate_for_project(employeeTimesheetData, employeeTimesheetIDs);

  await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);
};
