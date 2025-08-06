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
import employeeTimesheetData from "../data/employee/timesheet";
import managerTeamData from "../data/manager/team";
import managerTaskData from "../data/manager/task";
import managerProjectData from "../data/manager/project";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { createProject, deleteAllocation, deleteProject, getProjectDetails } from "../utils/api/projectRequests";
import { createTask, deleteTask, likeTask, updateTask } from "../utils/api/taskRequests";
import { getExchangeRate } from "../utils/api/erpNextRequests";
import { getEmployeeDetails } from "../utils/api/employeeRequests";
import { filterApi, shareProjectWithUser } from "../utils/api/frappeRequests";
import { deleteLeave } from "../utils/api/leaveRequests";
import { getWeekRange } from "../utils/dateUtils";
import { deleteEmployeeByName } from "./employeeHelper";
import { deleteUserGroupForEmployee } from "./teamTabHelper";

// Load env variables
const empID = process.env.EMP_ID;
const emp2ID = process.env.EMP2_ID;
const emp3ID = process.env.EMP3_ID;

// Define file paths for shared JSON data files
const TASK_TRACKER_PATH = path.resolve(__dirname, "../data/manager/tasks-to-delete.json");

// ------------------------------------------------------------------------------------------

/**
 * Updates timesheet entries for the given testCaseIDs.
 * Reads from and writes back to the shared JSON files so teardown can clean correctly.
 *
 * @param {string[]} testCaseIDs  The list of test case IDs to process
 */
export async function updateTimeEntries(testCaseIDs = [], jsonDir) {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // split IDs
  const empTCs = testCaseIDs.filter((tc) => tc in employeeTimesheetData);
  const mgrTCs = testCaseIDs.filter((tc) => tc in managerTeamData);
  const mgrProjectTCs = testCaseIDs.filter((tc) => tc in managerProjectData);

  // core update logic
  const updateEntries = (data, tcs) => {
    if (tcs.includes("TC2")) {
      data.TC2.cell.col = getWeekdayName(new Date());
    }
    for (const testCaseID of tcs) {
      const entry = data[testCaseID];
      if (!entry?.cell?.col) continue;

      // determine employee ID
      let employeeID;
      if (["TC2", "TC3"].includes(testCaseID)) {
        employeeID = emp2ID;
      } else if (["TC6", "TC7", "TC74", "TC92"].includes(testCaseID)) {
        employeeID = emp3ID;
      } else {
        employeeID = empID;
      }

      const formattedDate = getFormattedDate(getDateForWeekday(entry.cell.col));
      if (entry.payloadCreateTimesheet) {
        entry.payloadCreateTimesheet.date = formattedDate;
        entry.payloadCreateTimesheet.employee = employeeID;
      }
      Object.keys(entry)
        .filter((k) => k.startsWith("payloadFilterTimeEntry"))
        .forEach((k) => {
          entry[k].from_time = formattedDate;
          entry[k].employee = employeeID;
        });
    }
  };

  // apply updates
  updateEntries(employeeTimesheetData, empTCs);
  updateEntries(managerTeamData, mgrTCs);
  updateEntries(managerProjectData, mgrProjectTCs);

  // write employee data
  for (const tc of empTCs) {
    const payload = employeeTimesheetData[tc];
    if (!payload) continue;

    const filePath = path.join(jsonDir, `${tc}.json`);
    await writeDataToFile(filePath, { [tc]: payload });
    console.log(`✅ Updated Time Entry for ${tc} to ${filePath}`);
  }

  // write function for merging existing data
  const mergeAndWrite = async (tc, dataMap) => {
    const newPayload = dataMap[tc];
    if (!newPayload) return;

    const filePath = path.join(jsonDir, `${tc}.json`);

    let existingData = {};
    try {
      const raw = await fs.promises.readFile(filePath, "utf-8");
      existingData = JSON.parse(raw);
    } catch (e) {
      console.warn(`⚠️ Could not read existing data for ${tc}:`, e.message);
    }

    const mergedEntry = {
      ...(existingData[tc] || {}),
      ...newPayload,
    };

    await writeDataToFile(filePath, { [tc]: mergedEntry });
    console.log(`✅ Updated Time Entry for ${tc} to ${filePath}`);
  };

  // write manager team data
  for (const tc of mgrTCs) {
    await mergeAndWrite(tc, managerTeamData);
  }

  // write manager project data
  for (const tc of mgrProjectTCs) {
    await mergeAndWrite(tc, managerProjectData);
  }
}

// ------------------------------------------------------------------------------------------

/**
 * Creates timesheet entries for the given testCaseIDs.
 * Only processes test cases with a `payloadCreateTimesheet` field.
 *
 * @param {string[]} testCaseIDs  The list of test case IDs to process
 */
export async function createTimeEntries(testCaseIDs = [], jsonDir) {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // 1) Extract the single test‐case ID
  const [tcId] = testCaseIDs;

  // 2) Build path to its JSON stub
  const filePath = path.join(jsonDir, `${tcId}.json`);

  // 3) Read & parse the stub
  const testCaseData = await readJSONFile(filePath);
  ////console.log("JSON FILE PRESENT AT CREATE TIME ENTRIES IS:   \n", JSON.stringify(testCaseData, null, 2));

  const entry = testCaseData[tcId];
  if (!entry) {
    console.warn(`⚠️ No data found in ${tcId}.json`);
    return;
  }

  // 4) Grab the payload
  const payload = entry.payloadCreateTimesheet;
  if (!payload) {
    console.warn(`⚠️ No payloadCreateTimesheet found for TC ${tcId}`);
    return;
  }

  // 5) Create the timesheet
  await createTimesheet(payload);
  //console.log(`✅ Timesheet created for TC ${tcId}:`);
}
// ------------------------------------------------------------------------------------------

/**
 * Deletes timesheet entries for the given testCaseIDs.
 * Only processes test cases with a `payloadFilterTimeEntry` field.
 *
 * @param {string[]} testCaseIDs  The list of test case IDs to process
 */

export const deleteTimeEntries = async (testCaseIDs = [], jsonDir) => {
  // bail out if nothing to do
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) {
    return;
  }

  // we only support one TC at a time now
  const [tcId] = testCaseIDs;

  // build path to the per‑TC JSON stub
  const filePath = path.join(jsonDir, `${tcId}.json`);

  // read & parse it
  const fullStub = await readJSONFile(filePath);
  const testCaseData = fullStub[tcId];

  // collect all filter‐payload objects in that file
  const entries = Object.entries(testCaseData || {})
    .filter(([key]) => key.startsWith("payloadFilterTimeEntry"))
    .map(([, value]) => value)
    .filter(Boolean);

  if (entries.length === 0) {
    console.warn(`⚠️ No payloadFilterTimeEntry found for TC ${tcId}`);
    return;
  }
  // choose actor based on TC
  const roleMap = {
    TC2: "employee2",
    TC92: "employee3",
  };

  //  pick your actor:
  const actor = roleMap[tcId] || "employee";

  for (const entry of entries) {
    // derive parent & name identifiers
    const { parent, name } = await filterTimesheetEntry(entry);

    //console.log(`Deleting timesheet for TC ${tcId}: parent=${parent}, name=${name}`);

    await deleteTimesheet({ parent, name }, actor);

    // any special-case logging you still want
    if (entry.project_name === "TC02 Project") {
      console.warn(`RESPONSE OF DELETE TIMESHEET FOR TC02: ${entry.project_name}`);
    }
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Filters timesheet entries and returns the metadata of the matching time entry.
 *
 * Optional params: start_date, max_week.
 */
export const filterTimesheetEntry = async (opts) => {
  const { subject, description, project_name, from_time, employee, max_week } = opts;

  // fetch & unwrap…
  const res = await getTimesheetDetails({ employee, start_date: from_time, max_week });
  const json = res && typeof res.json === "function" ? await res.json() : res;
  const data = json.message.data;
  //console.dir(json.message, { depth: null, colors: true });
  ////console.log("\nGAP BETWEEN DATA\n");
  //console.dir(data, { depth: null, colors: true });

  // strip HTML from your input `description`
  const searchText = (description || "").replace(/<[^>]+>/g, "");

  for (const week of Object.values(data)) {
    for (const task of Object.values(week.tasks)) {
      if (task.subject !== subject) continue;

      // look for an entry whose no‑HTML description _exactly_ matches your searchText
      const match = (task.data || []).find((e) => {
        const noHtml = (e.description || "").replace(/<[^>]+>/g, "");
        ////console.log("NO HTML TEXT IS:", noHtml);
        return (
          noHtml === searchText && // exact match on full string
          e.project_name === project_name && // same project
          e.from_time.startsWith(from_time) // same day
        );
      });

      if (match) {
        //console.warn("✅ MATCH FOUND FOR FILTER TIMESHEET ENTRY   :", match);
        return match;
      }
    }
  }

  return {}; // nothing matched
};
// ------------------------------------------------------------------------------------------

/**
 * Creates projects for all testCaseIDs passed in.
 * Uses the in‑JS-module data, then writes out to JSON.
 */

export const createProjectForTestCases = async (testCaseIDs, jsonDir) => {
  const PROJECT_KEY_REGEX = /^payloadCreateProject(\w*)$/;

  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;
  const [tcId] = testCaseIDs;

  const stubPath = path.join(jsonDir, `${tcId}.json`);

  // Read the stub
  const fullStub = await readJSONFile(stubPath);
  const entry = fullStub[tcId];
  if (!entry) {
    console.warn(`⚠️ No data at key "${tcId}" in ${stubPath}`);
    return;
  }

  // 1. Find all keys starting with 'payloadCreateProject'
  const createProjectKeys = Object.keys(entry).filter((key) => PROJECT_KEY_REGEX.test(key));
  if (createProjectKeys.length === 0) {
    console.warn(`⚠️ No payloadCreateProject key for ${tcId}`);
    return;
  }

  // For repeated project keys, store their results
  const createdProjects = {};

  // 2. For each payloadCreateProject*, run creation/mutation logic
  for (const projectKey of createProjectKeys) {
    const projectPayload = entry[projectKey];
    if (!projectPayload) {
      console.warn(`⚠️ ${projectKey} is empty for ${tcId}`);
      continue;
    }

    // Create project
    const res = await createProject(projectPayload);
    if (!res?.data?.name) {
      console.error(`Failed to create project for ${tcId} (${projectKey}) as there is no data.name`);
      continue;
    }
    const projectId = res.data.name;
    const customCurrency = res.data.custom_currency;

    createdProjects[projectKey] = { projectId, customCurrency };

    // Share project, if needed (with the same pattern logic)
    // e.g., payloadShareProject1, payloadShareProjectABC, etc.
    const shareKey = projectKey.replace("payloadCreateProject", "payloadShareProject");
    if (Array.isArray(entry[shareKey])) {
      for (const sharePayload of entry[shareKey]) {
        await shareProjectWithUser({ ...sharePayload, name: projectId });
      }
    }

    // Mutate the inner stub for keys with corresponding postfix
    // e.g. payloadDeleteProject1, payloadCreateTask1, payloadCalculateBillingRate1, etc.
    const postfix = projectKey.slice("payloadCreateProject".length); // "" or "1", "2", "ABC"

    const deleteKey = `payloadDeleteProject${postfix}`;
    if (entry[deleteKey]) {
      entry[deleteKey].projectId = projectId;
    }

    const taskKey = `payloadCreateTask${postfix}`;
    if (entry[taskKey]) {
      entry[taskKey].project = projectId;
    }

    //Fill the projectID in the payloadCreateAllocation
    const allocationKey = `payloadCreateAllocation${postfix}`;
    if (entry[allocationKey]) {
      entry[allocationKey].project = projectId;
    }

    const billingKey = `payloadCalculateBillingRate${postfix}`;
    if (entry[billingKey]) {
      Object.assign(entry[billingKey], {
        project: projectId,
        custom_currency_for_project: customCurrency,
      });
    }

    console.log(`✅ CREATE PROJECT SUCCESS for ${tcId} -> ${projectKey} (projectId=${projectId})`);
  }

  // Write back updated stub
  await writeDataToFile(stubPath, { [tcId]: entry });
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes all projects for a given testCaseID, including all suffixed payloadDeleteProject keys.
 * Handles payloadDeleteProject, payloadDeleteProject2, etc.
 */
export const deleteProjects = async (testCaseIDs = [], jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) {
    return;
  }

  // Only process the first test case ID
  const [tcId] = testCaseIDs;

  // Path to stub file
  const filePath = path.join(jsonDir, `${tcId}.json`);

  // Read stub
  const stub = await readJSONFile(filePath);
  const entry = stub[tcId];
  if (!entry) {
    console.warn(`⚠️ No data object found in ${tcId}.json`);
    return;
  }

  // Find all payloadDeleteProject keys (e.g., payloadDeleteProject, payloadDeleteProject2, ...)
  const projectDeleteKeys = Object.keys(entry).filter((key) => key.startsWith("payloadDeleteProject"));
  if (projectDeleteKeys.length === 0) {
    console.warn(`⚠️ No payloadDeleteProject key(s) found for TC ${tcId}`);
    return;
  }

  for (const deleteKey of projectDeleteKeys) {
    const projId = entry[deleteKey]?.projectId;
    if (!projId) {
      console.warn(`⚠️ No ${deleteKey}.projectId found for TC ${tcId}`);
      continue;
    }
    await deleteProject(projId);
    //console.log(`🗑️  Deleted project ${projId} for TC ${tcId} (${deleteKey})`);
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Creates tasks for all testCaseIDs passed in.
 */

export const createTaskForTestCases = async (testCaseIDs, jsonDir) => {
  // nothing to do if no ID provided
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // we only expect one ID per run
  const [tcId] = testCaseIDs;

  // resolve its stub file
  const stubPath = path.join(jsonDir, `${tcId}.json`);

  // read the entire stub (wrapped under the TC key)
  const fullStub = await readJSONFile(stubPath);
  const entry = fullStub[tcId];
  if (!entry || !entry.payloadCreateTask) {
    console.warn(`⚠️ [${tcId}] no payloadCreateTask, skipping`);
    return;
  }

  // CREATE TASK
  const createRes = await createTask(entry.payloadCreateTask);
  if (!createRes?.data?.name) {
    console.error(`❌ [${tcId}] createTask failed`);
    return;
  }
  const taskID = createRes.data.name;

  // wire up delete
  if (entry.payloadDeleteTask) {
    entry.payloadDeleteTask.taskID = taskID;
  }

  // optional UPDATE
  if (entry.payloadUpdateTask) {
    await updateTask(taskID, entry.payloadUpdateTask);
  }

  // LIKE TASK
  if (entry.payloadLikeTask) {
    entry.payloadLikeTask.name = taskID;
    const likeRes = await likeTask(taskID, entry.payloadLikeTask.role);
    if (!likeRes || typeof likeRes !== "object") {
      console.error(`❌ [${tcId}] likeTask failed`);
    } else {
      console.log(`✅ [${tcId}] liked task ${taskID}`);
    }
  }

  // TIMESHEET WIRING
  if (entry.payloadCreateTimesheet) {
    entry.payloadCreateTimesheet.task = taskID;
  }

  // persist the mutated stub, wrapped under the TC key
  await writeDataToFile(stubPath, { [tcId]: entry });
  console.log(`✅ CREATE TASK SUCCESS FOR: ${testCaseIDs}`);
};
// ------------------------------------------------------------------------------------------

/**
 * Deletion of tasks by their name that were created though UI
 **/

export const deleteByTaskName = async () => {
  try {
    if (!fs.existsSync(TASK_TRACKER_PATH)) {
      // Silently skip if file not found
      return;
    }

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
        //console.log("Task found and ID to delete:", taskID);
        await deleteTask(taskID);
      } else {
        console.log(`Task "${taskName}" not found in system to delete. Skipping...`);
      }
    }

    // Optionally clear the file after deletion
    // await fs.writeFile(TASK_TRACKER_PATH, JSON.stringify([], null, 2), "utf-8");
    // //console.log("Deleted all listed tasks and cleared tracking file.");
  } catch (error) {
    console.error("Error while deleting tasks by name:", error.message);
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes tasks for all provided testCaseIDs.
 * Reads the shared JSON files to lookup taskIDs, and
 * deletes each, using admin rights for specific cases.
 */

export const deleteTasks = async (testCaseIDs, jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const adminCases = new Set(["TC2", "TC92"]);

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];

    const taskID = entry?.payloadDeleteTask?.taskID;
    if (!taskID) {
      console.warn(`⚠️ [${tcId}] no payloadDeleteTask.taskID, skipping delete`);
      continue;
    }

    try {
      if (adminCases.has(tcId)) {
        await deleteTask(taskID, "admin");
        //console.log(`🗑️  [${tcId}] deleted task ${taskID} as admin`);
      } else {
        await deleteTask(taskID);
        //console.log(`🗑️  [${tcId}] deleted task ${taskID}`);
      }
    } catch (err) {
      console.error(`❌ [${tcId}] Failed to delete task ${taskID}: ${err.message}`);
    }
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Calculates hourly billing rate of employee and billing rate of a project
 * for the provided testCaseIDs array.
 */
export const calculateHourlyBilling = async (testCaseIDs = [], jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // 1) Fetch employee info once
  const empRes = await getEmployeeDetails(empID, "admin");
  const employee_CTC = empRes.data.ctc;
  //console.log("EMPLOYEE SALARY: ", employee_CTC);
  const employee_currency = empRes.data.salary_currency;
  //console.log("EMPLOYEE CURRENCY: ", employee_currency);

  // 2) Loop through each TC
  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);

    // 3) Read the wrapped stub { "TCn": { … } }
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];
    if (!entry) {
      console.warn(`⚠️ No data found under key "${tcId}" in ${stubPath}`);
      continue;
    }
    // 4) Only process if there's a billing payload
    const ratePayload = entry.payloadCalculateBillingRate;
    if (!ratePayload) {
      continue; // nothing to do for this TC
    }

    // 5) Determine hourly rate, converting currency if needed
    let hourly_billing_rate;
    if (employee_currency !== ratePayload.custom_currency_for_project) {
      const convertRes = await getExchangeRate(employee_currency, ratePayload.custom_currency_for_project);

      const convertedCTC = convertRes.message * employee_CTC;
      //console.log("CONVERTED EMPLOYEE CTC ", convertedCTC);
      hourly_billing_rate = convertedCTC / 12 / 160;
      //console.log("HOURLY BILLING RATE: ", hourly_billing_rate);
    } else {
      hourly_billing_rate = employee_CTC / 12 / 160;
    }

    // 6) Fetch project financials
    const projRes = await getProjectDetails(ratePayload.project);
    ratePayload.total_billable_amount = projRes.data.total_billable_amount;
    ratePayload.total_costing_amount = projRes.data.total_costing_amount;
    ratePayload.hourly_billing_rate = hourly_billing_rate;

    // 7) Write it back wrapped under the TC key
    await writeDataToFile(stubPath, { [tcId]: entry });
    //console.log(`✅ Updated billing for ${tcId} in ${stubPath}`);
  }
};

/**
 * Delete all the leaves, tasks, time entries, resource allocations associated with the project,
 * and delete the project itself.
 */
export const cleanUpProjects = async (data) => {
  const deletedData = [];

  for (const key in data) {
    const tc = data[key];

    // Find all project creation keys
    const createProjectKeys = Object.keys(tc).filter(
      (k) => k.startsWith("payloadCreateProject") || k === "createProjectByUI"
    );

    for (const projectKey of createProjectKeys) {
      const projectPayload = tc[projectKey];
      if (!projectPayload || !projectPayload.project_name) continue;

      const projectName = projectPayload.project_name;

      // Get Project ID by project_name
      const projectRes = await filterApi("Project", [["Project", "project_name", "=", projectName]]);
      const projectId = projectRes?.message?.values?.[0]?.[0];
      if (!projectId) continue;

      console.warn(`\nObtained ProjectId value for ${key} -> ${projectKey} is: ${projectId}`);

      // Get Task IDs for this projectId
      const taskRes = await filterApi("Task", [["Task", "project", "=", projectId]]);
      const taskIds = Array.isArray(taskRes?.message?.values) ? taskRes.message.values.map((v) => v[0]) : [];

      if (taskIds.length) {
        console.warn(`OBTAINED TASKS for ${key} -> ${projectKey}:`, taskIds);
      }

      // Get Timesheet IDs for this projectId
      const timesheetRes = await filterApi("Timesheet", [["Timesheet", "parent_project", "=", projectId]], "admin");
      const timesheetIds = Array.isArray(timesheetRes?.message?.values)
        ? timesheetRes.message.values.flat().filter((v) => typeof v === "string")
        : [];

      if (timesheetIds.length) {
        console.warn(`OBTAINED TIMESHEET IDS FOR ${key} -> ${projectKey}:`, timesheetIds);
      }

      // Get Resource Allocation IDs for this projectId
      const allocationRes = await filterApi("Resource Allocation", [
        ["Resource Allocation", "project", "=", projectId],
      ]);
      let allocationIds = [];

      if (
        allocationRes &&
        typeof allocationRes.message === "object" &&
        !Array.isArray(allocationRes.message) &&
        Array.isArray(allocationRes.message.keys) &&
        Array.isArray(allocationRes.message.values)
      ) {
        const nameIndex = allocationRes.message.keys.indexOf("name");
        if (nameIndex >= 0) {
          allocationIds = allocationRes.message.values.map((row) => row[nameIndex]);
        }
      }

      if (allocationIds.length) {
        console.warn(`OBTAINED ALLOCATION IDS FOR ${key} -> ${projectKey}:`, allocationIds);
      }

      // Collect deletion info
      deletedData.push({
        projectKey,
        projectName,
        projectId,
        taskIds,
        timesheetIds,
        allocationIds,
      });

      // Delete Timesheets
      for (const timesheetId of timesheetIds) {
        if (!timesheetId || typeof timesheetId !== "string") {
          console.error(`Invalid timesheetId encountered:`, timesheetId);
          continue;
        }
        try {
          await deleteTimesheetbyID(timesheetId, "admin");
        } catch (err) {
          console.error(`Failed to delete timesheet ${timesheetId}:`, err.message);
        }
      }

      // Delete Tasks
      for (const taskId of taskIds) {
        try {
          await deleteTask(taskId);
        } catch (err) {
          console.error(`Failed to delete task ${taskId}:`, err.message);
        }
      }

      // Delete Resource Allocations
      for (const allocationId of allocationIds) {
        if (!allocationId || typeof allocationId !== "string") {
          console.error(`Invalid allocationId encountered:`, allocationId);
          continue;
        }
        try {
          await deleteAllocation(allocationId);
        } catch (err) {
          console.error(`Failed to delete resource allocation ${allocationId}:`, err.message);
        }
      }

      // Delete Project
      if (projectId) {
        try {
          await deleteProject(projectId);
        } catch (err) {
          console.error(`Failed to delete project ${projectId}:`, err.message);
        }
      }
    }
  }

  return deletedData;
};

// ------------------------------------------------------------------------------------------

/**
 * Delete Leaves associated to an employee
 */
export const deleteLeaveOfEmployee = async () => {
  //Fetch Leave ID for employee if any exists
  const filterResponse = await filterApi(
    "Leave Application",
    [
      ["Leave Application", "employee", "=", `${emp2ID}`],
      ["Leave Application", "status", "=", "Open"],
    ],
    "admin"
  );

  //Delete leave if leave ID is found in the filter request
  if (filterResponse?.message?.values[0]) {
    const leaveID = filterResponse.message.values[0];
    await deleteLeave(leaveID);
    console.warn("✅ A leave request for employee was found and deleted");
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Combined json files to pass for deleting the orphan test data
 */
export const readAndCleanAllOrphanData = async () => {
  const mergedData = {
    ...employeeTimesheetData,
    ...managerTaskData,
    ...managerTeamData,
    ...managerProjectData,
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
