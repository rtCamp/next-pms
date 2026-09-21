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
import {
  createProject,
  createView,
  deleteAllocation,
  deleteProject,
  getProjectDetails,
  getViewsByLabel,
} from "../utils/api/projectRequests";
import { createTask, deleteTask, likeTask, updateTask } from "../utils/api/taskRequests";
import { getExchangeRate } from "../utils/api/erpNextRequests";
import { getEmployeeDetails } from "../utils/api/employeeRequests";
import { filterApi, shareProjectWithUser } from "../utils/api/frappeRequests";
import { deleteLeave } from "../utils/api/leaveRequests";
import { getWeekRange } from "../utils/dateUtils";
import { deleteEmployeeByName } from "./employeeHelper";
import {
  getDocList,
  cancelDocument,
  createDocument,
  deleteDocument,
  deleteWithLockRetry,
} from "../utils/api/apiClient";

// Remove all HTML tags (repeatedly) from a string
function stripHtmlTags(input) {
  let prev;
  do {
    prev = input;
    input = input.replace(/<[^>]+>/g, "");
  } while (input !== prev);
  return input;
}

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
      } else if (["TC5", "TC6", "TC7", "TC74", "TC92", "TC60"].includes(testCaseID)) {
        employeeID = emp3ID;
      } else {
        employeeID = empID;
      }

      const formattedDate = getFormattedDate(getDateForWeekday(entry.cell.col));
      // A test may seed more than one entry (TC93 needs one per employee, so the
      // project filter - which matches logged time, not project shares - returns
      // both). An explicit `employee` in the payload wins, so a single test can
      // book time for different people; otherwise it falls back to the per-TC
      // employee resolved above.
      Object.keys(entry)
        .filter((k) => k.startsWith("payloadCreateTimesheet"))
        .forEach((k) => {
          entry[k].date = formattedDate;
          entry[k].employee = entry[k].employee || employeeID;
        });
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

  const [tcId] = testCaseIDs;

  const filePath = path.join(jsonDir, `${tcId}.json`);

  const testCaseData = await readJSONFile(filePath);
  ////console.log("JSON FILE PRESENT AT CREATE TIME ENTRIES IS:   \n", JSON.stringify(testCaseData, null, 2));

  const entry = testCaseData[tcId];
  if (!entry) {
    console.warn(`⚠️ No data found in ${tcId}.json`);
    return;
  }

  // A test can seed several timesheet payloads (see TC93).
  const keys = Object.keys(entry).filter((k) => k.startsWith("payloadCreateTimesheet"));
  if (keys.length === 0) {
    console.warn(`⚠️ No payloadCreateTimesheet found for TC ${tcId}`);
    return;
  }

  for (const key of keys) {
    const payload = entry[key];
    if (!payload) continue;
    await createTimesheet(payload);
    console.log(`✅ Timesheet created for ${tcId} -> ${key} (${payload.employee} on ${payload.date})`);
  }
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
  ////console.log("\nGAP BETWEEN DATA\n");

  // strip HTML from your input `description`
  const searchText = stripHtmlTags(description || "");

  for (const week of Object.values(data)) {
    for (const task of Object.values(week.tasks)) {
      if (task.subject !== subject) continue;

      // look for an entry whose no‑HTML description _exactly_ matches your searchText
      const match = (task.data || []).find((e) => {
        const noHtml = stripHtmlTags(e.description || "");
        ////console.log("NO HTML TEXT IS:", noHtml);
        return (
          noHtml === searchText && // exact match on full string
          e.project_name === project_name && // same project
          e.from_time.startsWith(from_time) // same day
        );
      });

      if (match) {
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

  // TIMESHEET WIRING - every entry that has not pinned its own task.
  Object.keys(entry)
    .filter((k) => k.startsWith("payloadCreateTimesheet"))
    .forEach((k) => {
      if (!entry[k].task || String(entry[k].task).startsWith("filled-automatically")) {
        entry[k].task = taskID;
      }
    });

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
      // Every match, not just the first: a failed cleanup leaves another row
      // with the same subject, and `values[0]` only ever reached one of them.
      const rows = await getDocList("Task", [["subject", "=", taskName]], { fields: ["name"] });
      if (rows.length === 0) {
        console.log(`Task "${taskName}" not found in system to delete. Skipping...`);
        continue;
      }
      for (const row of rows) {
        const { deleted } = await deleteWithLockRetry(() => deleteDocument("Task", row.name), {
          label: `Task ${row.name}`,
        });
        if (deleted) console.log(`🗑  Deleted task ${row.name} ("${taskName}")`);
      }
    }

    // Optionally clear the file after deletion
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
      } else {
        await deleteTask(taskID);
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

  const empRes = await getEmployeeDetails(empID, "admin");
  const employee_CTC = empRes.data.ctc;
  const employee_currency = empRes.data.salary_currency;

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);

    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];
    if (!entry) {
      console.warn(`⚠️ No data found under key "${tcId}" in ${stubPath}`);
      continue;
    }
    const ratePayload = entry.payloadCalculateBillingRate;
    if (!ratePayload) {
      continue; // nothing to do for this TC
    }

    let hourly_billing_rate;
    if (employee_currency !== ratePayload.custom_currency_for_project) {
      const convertRes = await getExchangeRate(employee_currency, ratePayload.custom_currency_for_project);

      const convertedCTC = convertRes.message * employee_CTC;
      hourly_billing_rate = convertedCTC / 12 / 160;
    } else {
      hourly_billing_rate = employee_CTC / 12 / 160;
    }

    // 6) Fetch project financials.
    //
    // The project's totals are rolled up from the timesheet *after* the entry is
    // saved, and not before this call would otherwise read them - reading
    // straight away returns 0 and those zeros get written into the stub, which
    // is what makes TC82-TC89 fail with "expected <rate>, received 0". Verified
    // directly: the Timesheet row carries the right costing_rate/billing_rate
    // immediately, while the Project still reads 0 and is correct a moment
    // later. Poll until it lands.
    let projRes = await getProjectDetails(ratePayload.project);
    for (let attempt = 0; attempt < 8 && !projRes?.data?.total_costing_amount; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      projRes = await getProjectDetails(ratePayload.project);
    }

    if (!projRes?.data?.total_costing_amount) {
      console.warn(
        `⚠️ ${tcId}: project ${ratePayload.project} still reports no costing after waiting - ` +
          `billing assertions for this test will compare against 0.`
      );
    }

    ratePayload.total_billable_amount = projRes.data.total_billable_amount;
    ratePayload.total_costing_amount = projRes.data.total_costing_amount;
    ratePayload.hourly_billing_rate = hourly_billing_rate;

    await writeDataToFile(stubPath, { [tcId]: entry });
  }
};

/**
 * Delete all the leaves, tasks, time entries, resource allocations associated with the project,
 * and delete the project itself.
 */
export const cleanUpProjects = async (data) => {
  const deletedData = [];
  // Every delete below is wrapped in try/catch so one failure cannot abort the
  // sweep - which also means failures scroll past unnoticed in a long run. Tally
  // them and print a summary at the end.
  const failures = [];
  // Counted so a teardown that reached nothing cannot report success - an
  // unreachable site and a clean slate both resolve zero projects.
  let looked = 0;
  let responded = 0;
  let found = 0;

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
      looked += 1;
      // reportview answers `{message: []}` when nothing matches and
      // `{message: {keys, values}}` when something does, so the presence of
      // `message` - not of `values` - is what separates a lookup that ran from one
      // that did not.
      if (projectRes?.message !== undefined) responded += 1;
      const projectId = projectRes?.message?.values?.[0]?.[0];
      if (!projectId) continue;
      found += 1;

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
          failures.push(`Timesheet ${timesheetId}`);
          console.error(`Failed to delete timesheet ${timesheetId}:`, err.message);
        }
      }

      // Delete Tasks
      for (const taskId of taskIds) {
        try {
          await deleteTask(taskId);
        } catch (err) {
          failures.push(`Task ${taskId}`);
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
          failures.push(`Resource Allocation ${allocationId}`);
          console.error(`Failed to delete resource allocation ${allocationId}:`, err.message);
        }
      }

      // Delete Project
      if (projectId) {
        try {
          await deleteProject(projectId);
        } catch (err) {
          failures.push(`Project ${projectId} (${projectName})`);
          console.error(`Failed to delete project ${projectId}:`, err.message);
        }
      }
    }
  }

  if (looked > 0 && responded === 0) {
    console.error(
      `\n❌ Teardown looked up ${looked} seeded project(s) and not one lookup came back. That is the API failing, ` +
        `not a clean slate - check the site is up (a deploy answers every request with 503) and re-run teardown. ` +
        `Seeded data is still on staging.`
    );
  } else if (failures.length) {
    console.warn(
      `\n⚠️  Teardown could not delete ${failures.length} record(s) - they will be swept by the next run's setup:`
    );
    for (const f of failures) console.warn(`    - ${f}`);
  } else {
    console.log(
      `\n✅ Teardown deleted all ${deletedData.length} seeded project(s) and their child records ` +
        `(${found} of ${looked} lookups matched; the rest were already gone).`
    );
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
    const { deleted } = await deleteLeave(leaveID);
    if (deleted) console.log(`🗑  Deleted leave ${leaveID}`);
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes the views this run created.
 *
 * createViewForTestCases() records the id under payloadDeleteView<postfix>, and
 * `seeded` says whether it created the view or reused an existing one. Nothing
 * called deleteView() before this, so seeded views simply accumulated.
 */
export const deleteViewsForTestCases = async (testCaseIDs = [], jsonDir) => {
  for (const tcId of testCaseIDs) {
    let entry;
    try {
      entry = (await readJSONFile(path.join(jsonDir, `${tcId}.json`)))?.[tcId];
    } catch {
      continue;
    }
    if (!entry) continue;

    for (const key of Object.keys(entry).filter((k) => k.startsWith("payloadDeleteView"))) {
      const { viewId, seeded } = entry[key] ?? {};
      if (!viewId || !seeded) continue;

      const { deleted } = await deleteDocument("PMS View Setting", String(viewId));
      if (deleted) console.log(`🗑  Deleted view ${viewId} for ${tcId}`);
    }
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Records when this run began, on the server's clock.
 *
 * Frappe stamps `creation` in the server's timezone, which the runner's clock
 * need not share, so a UTC marker widens the sweep window. Reading `creation`
 * back off a throwaway document avoids the timezone arithmetic entirely.
 */
export const writeRunMarker = async (jsonDir) => {
  let startedAt = null;
  try {
    const doc = await createDocument("ToDo", { description: "next-pms e2e run marker" });
    startedAt = doc?.creation ?? null;
    if (doc?.name) await deleteDocument("ToDo", doc.name);
  } catch (err) {
    console.warn(`⚠️ Could not establish a run marker: ${err.message}`);
  }
  await writeDataToFile(path.join(jsonDir, "_run-meta.json"), { startedAt });
  console.log(`🕒 Run marker: ${startedAt ?? "none - teardown will skip the timesheet sweep"}`);
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes the timesheets this run booked onto the shared employee accounts.
 *
 * cleanUpProjects() finds timesheets through `parent_project`, so it only ever
 * sees time booked against a project this run seeded. Most tests book onto the
 * shared accounts and pre-existing projects instead, and that time was never
 * cleaned up - EMP-00911 had accumulated timesheets going back months.
 *
 * Scoped by the run-start marker so it can only remove what this run created.
 */
export const deleteTimesheetsCreatedThisRun = async (jsonDir) => {
  let startedAt;
  try {
    startedAt = (await readJSONFile(path.join(jsonDir, "_run-meta.json")))?.startedAt;
  } catch {
    startedAt = null;
  }
  if (!startedAt) {
    console.warn("⚠️ No run-start marker found; skipping the timesheet sweep rather than guessing a cutoff.");
    return;
  }

  const employeeIds = [process.env.EMP_ID, process.env.EMP2_ID, process.env.EMP3_ID].filter(Boolean);
  for (const employee of employeeIds) {
    const timesheets = await getDocList(
      "Timesheet",
      [
        ["employee", "=", employee],
        ["creation", ">=", startedAt],
      ],
      { fields: ["name", "docstatus"] }
    );

    let cleared = 0;
    for (const ts of timesheets) {
      if (ts.docstatus === 1) await cancelDocument("Timesheet", ts.name);
      const { deleted } = await deleteWithLockRetry(() => deleteDocument("Timesheet", ts.name), {
        label: `Timesheet ${ts.name}`,
      });
      if (deleted) cleared += 1;
    }
    // Report what actually went, not what was attempted.
    if (timesheets.length) console.log(`🗑  Cleared ${cleared}/${timesheets.length} timesheet(s) for ${employee}`);
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

// ------------------------------------------------------------------------------------------

/**
 * Submits a seeded timesheet for approval, for any test case carrying a
 * `payloadSubmitTimesheet` key.
 *
 * Needed because the team grid only renders a status control for a timesheet
 * that is actually reviewable. A freshly created timesheet sits at "Not
 * submitted", where the status column is empty - so there is nothing to click
 * to open the review pane, and any test that approves or rejects has no way in.
 * (Verified: "Not submitted" row has 7 buttons, all "Add time"; a submitted one
 * has 8, the extra being the status trigger.)
 *
 * The submit is done as the employee, since that is who submits their own
 * timesheet; `role` names the API auth state to use.
 */
export const submitTimesheetForTestCases = async (testCaseIDs = [], jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const [tcId] = testCaseIDs;
  const filePath = path.join(jsonDir, `${tcId}.json`);

  let fullStub;
  try {
    fullStub = await readJSONFile(filePath);
  } catch (err) {
    console.warn(`⚠️ Failed to read stub for ${tcId}: ${err.message}`);
    return;
  }

  const entry = fullStub[tcId];
  const payload = entry?.payloadSubmitTimesheet;
  if (!payload) return;

  const { monday, friday } = getWeekRange();
  // No fallback to the default account on purpose. A test that asks for its own
  // employee (payloadCreateReviewee) must not silently submit a *shared* one -
  // that is what broke TC11, whose employee has to stay unsubmitted.
  const employee = payload.employee;
  if (!employee) {
    console.warn(
      `⚠️ Skipping timesheet submit for ${tcId}: no employee pinned. If this test declares ` +
        `payloadCreateReviewee, its employee could not be created (Employee creation is ` +
        `currently failing on this environment).`
    );
    return;
  }
  // The backend resolves the approver with frappe.db.exists("Employee", ...),
  // so this is an Employee ID (EMP-000xx) - an email 404s with
  // "Reporting Manager does not exist."
  const approver = payload.approver ?? process.env.REP_MAN_ID;
  const role = payload.role ?? "employee";

  try {
    await submitTimesheet(
      {
        start_date: payload.start_date ?? monday,
        end_date: payload.end_date ?? friday,
        notes: payload.notes ?? `submitted by global setup for ${tcId}`,
        approver,
        employee,
      },
      role
    );
    console.log(`✅ Timesheet submitted for approval for ${tcId} (${employee} -> ${approver})`);
  } catch (err) {
    // Only an already-submitted timesheet is benign. Match that phrase exactly:
    // a loose /submitted/ test also matches the word inside the echoed request
    // payload (the notes above), which silently turned a real 404 into a
    // "already submitted" success line.
    if (/already been submitted|already submitted/i.test(err.message)) {
      console.log(`ℹ️ Timesheet for ${tcId} was already submitted.`);
      return;
    }
    console.warn(`❌ Timesheet submit FAILED for ${tcId} - the review pane will not be reachable: ${err.message}`);
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Seed saved views (PMS View Setting) for any test case carrying a
 * payloadCreateView* key, and record the created document name back into the
 * stub so teardown can remove it.
 *
 * A view is a precondition for the public/private view tests rather than the
 * behaviour under test, so it is seeded like projects and tasks instead of
 * depending on one created by hand on the environment.
 */
export const createViewForTestCases = async (testCaseIDs, jsonDir) => {
  const VIEW_KEY_REGEX = /^payloadCreateView(\w*)$/;

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub?.[tcId];
    if (!entry) continue;

    for (const viewKey of Object.keys(entry).filter((key) => VIEW_KEY_REGEX.test(key))) {
      const payload = entry[viewKey];
      if (!payload?.label) continue;

      // Reuse an existing view with the same label so repeated runs do not pile
      // up duplicates - the label is what the UI shows and the test looks for.
      const existing = await getViewsByLabel(payload.label);
      let viewId = existing?.[0]?.name;

      if (!viewId) {
        const res = await createView(payload);
        viewId = res?.data?.name;
        if (!viewId) {
          console.error(`Failed to create view for ${tcId} (${viewKey})`);
          continue;
        }
        console.warn(`✅ CREATE VIEW SUCCESS for ${tcId} -> ${viewKey} (${payload.label}, id=${viewId})`);
      } else {
        console.warn(`↩️ Reusing existing view "${payload.label}" (id=${viewId}) for ${tcId}`);
      }

      const postfix = viewKey.slice("payloadCreateView".length);
      const deleteKey = `payloadDeleteView${postfix}`;
      // `seeded` records whether this run created the view or merely reused one
      // that was already there. Teardown deletes only the ones it created - a
      // view someone made by hand can share a label and must survive the run.
      entry[deleteKey] = { ...(entry[deleteKey] || {}), viewId, seeded: !existing?.[0]?.name };
      await writeDataToFile(stubPath, fullStub);
    }
  }
};
