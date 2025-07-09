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
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { createProject, deleteProject, getProjectDetails } from "../utils/api/projectRequests";
import { createTask, deleteTask, likeTask, updateTask } from "../utils/api/taskRequests";
import { getExchangeRate } from "../utils/api/erpNextRequests";
import { getEmployeeDetails } from "../utils/api/employeeRequests";
import { filterApi, shareProjectWithUser } from "../utils/api/frappeRequests";
import { deleteLeave } from "../utils/api/leaveRequests";
import { getWeekRange } from "../utils/dateUtils";
import { deleteEmployeeByName } from "./employeeHelper";
//import { deleteUserGroupForEmployee } from "./teamTabHelper";
// Load env variables
const empID = process.env.EMP_ID;
const emp2ID = process.env.EMP2_ID;
const emp3ID = process.env.EMP3_ID;

// Define file paths for shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file
//const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json"); // File path of the manager team data JSON file
//const managerTaskDataFilePath = path.resolve(__dirname, "../data/manager/shared-task.json"); // File path of the manager team data JSON file
const TASK_TRACKER_PATH = path.resolve(__dirname, "../data/manager/tasks-to-delete.json");

// Global variables to store shared data and reused across functions
//let sharedEmployeeTimesheetData;
//let sharedManagerTeamData;
//let sharedManagerTaskData;

// ------------------------------------------------------------------------------------------

/**
 * Updates timesheet entries for the given testCaseIDs.
 * Reads from and writes back to the shared JSON files so teardown can clean correctly.
 *
 * @param {string[]} testCaseIDs  The list of test case IDs to process
 */
export async function updateTimeEntries(testCaseIDs = []) {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // split IDs
  const empTCs = testCaseIDs.filter((tc) => tc in employeeTimesheetData);
  const mgrTCs = testCaseIDs.filter((tc) => tc in managerTeamData);

  // core update logic
  const updateEntries = (data, tcs) => {
    if (tcs.includes("TC2")) {
      data.TC2.cell.col = getWeekdayName(new Date());
    }
    for (const testCaseID of tcs) {
      const entry = data[testCaseID];
      if (!entry?.cell?.col) continue;
      const formattedDate = getFormattedDate(getDateForWeekday(entry.cell.col));
      const employeeID = testCaseID === "TC92" ? emp3ID : testCaseID === "TC2" ? emp2ID : empID;
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

  // ensure output directory exists
  const outDir = path.resolve(__dirname, "../data/json-files");

  await fs.promises.mkdir(outDir, { recursive: true });

  // write per-TC files
  for (const tc of empTCs) {
    const payload = employeeTimesheetData[tc];
    if (!payload) continue;
    //const filePath = path.join(outDir, `${tc}.json`);
    const filePath = path.resolve(__dirname, "../data/json-files", `${tc}.json`);

    await writeDataToFile(filePath, { [tc]: payload });
    console.log(`✅ Wrote updated timesheet for ${tc} to ${filePath}`);
  }
  /*
  for (const tc of mgrTCs) {
    const payload = managerTeamData[tc];
    if (!payload) continue;
    //const filePath = path.join(outDir, `${tc}.json`);
    const filePath = path.resolve(__dirname, "../data/json-files", `${tc}.json`);

    await writeDataToFile(filePath, { [tc]: payload });
    console.log(`✅ Wrote updated manager data for ${tc} to ${filePath}`);
  }
    */
  for (const tc of mgrTCs) {
    const newPayload = managerTeamData[tc];
    if (!newPayload) continue;

    const filePath = path.resolve(__dirname, "../data/json-files", `${tc}.json`);

    // 🧩 Merge with existing JSON file
    let existingData = {};
    try {
      const raw = await fs.promises.readFile(filePath, "utf-8");
      existingData = JSON.parse(raw);
    } catch (e) {
      console.warn(`⚠️ Could not read existing data for ${tc}:`, e.message);
    }

    // Merge: existingData[tc] merged with newPayload
    const mergedEntry = {
      ...(existingData[tc] || {}),
      ...newPayload,
    };

    await writeDataToFile(filePath, { [tc]: mergedEntry });
    console.log(`✅ Wrote merged manager data for ${tc} to ${filePath}`);
  }
}
/*
export async function updateTimeEntries(testCaseIDs = []) {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // split incoming IDs by where they live
  const empTCs = testCaseIDs.filter((tc) => tc in employeeTimesheetData);
  const mgrTCs = testCaseIDs.filter((tc) => tc in managerTeamData);

  // the core update logic (your original updateEntries)
  const updateEntries = (data, tcs) => {
    // special case: set your dynamic weekday‑col before anything else
    if (tcs.includes("TC2")) {
      data.TC2.cell.col = getWeekdayName(new Date());
    }

    for (const testCaseID of tcs) {
      const entry = data[testCaseID];
      if (!entry?.cell?.col) continue;

      const formattedDate = getFormattedDate(getDateForWeekday(entry.cell.col));

      // pick the right employee ID
      const employeeID = testCaseID === "TC92" ? emp3ID : testCaseID === "TC2" ? emp2ID : empID;

      // update create‑timesheet payload
      if (entry.payloadCreateTimesheet) {
        entry.payloadCreateTimesheet.date = formattedDate;
        entry.payloadCreateTimesheet.employee = employeeID;
      }
      console.warn("UPDATING ENTRY FOR", entry);
      // update all filter‑time entries
      Object.keys(entry)
        .filter((k) => k.startsWith("payloadFilterTimeEntry"))
        .forEach((k) => {
          entry[k].from_time = formattedDate;
          entry[k].employee = employeeID;
        });
    }
  };

  // 1) update in‑memory modules
  updateEntries(employeeTimesheetData, empTCs);
  updateEntries(managerTeamData, mgrTCs);
  // Write updated data to shared JSON files
  fs.writeFileSync(employeeTimesheetDataFilePath, JSON.stringify(employeeTimesheetData, null, 2));
  fs.writeFileSync(managerTeamDataFilePath, JSON.stringify(managerTeamData, null, 2));
}
*/
// ------------------------------------------------------------------------------------------

/**
 * Creates timesheet entries for the given testCaseIDs.
 * Only processes test cases with a `payloadCreateTimesheet` field.
 *
 * @param {string[]} testCaseIDs  The list of test case IDs to process
 */
export async function createTimeEntries(testCaseIDs = []) {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // 1) Extract the single test‐case ID
  const [tcId] = testCaseIDs;

  // 2) Build path to its JSON stub
  const filePath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);

  // 3) Read & parse the stub
  const testCaseData = await readJSONFile(filePath);
  //console.log("JSON FILE PRESENT AT CREATE TIME ENTRIES IS:   \n", JSON.stringify(testCaseData, null, 2));

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
  console.log(`✅ Timesheet created for TC ${tcId}:`);
}
/*
export async function createTimeEntries(testCaseIDs) {
  // Load data
  const employeeData = await readJSONFile(employeeTimesheetDataFilePath);
  const managerData = await readJSONFile(managerTeamDataFilePath);
  const testCaseJsonFile = path.resolve(__dirname, "../data/json-files", `${testCaseIDs}.json`);

  // Collect all payloadCreateTimesheet objects for requested IDs
  const entries = [];
  for (const id of testCaseIDs) {
    const empEntry = employeeData[id]?.payloadCreateTimesheet;
    if (empEntry) entries.push(empEntry);

    const mgrEntry = managerData[id]?.payloadCreateTimesheet;
    if (mgrEntry) entries.push(mgrEntry);
  }

  // Create each timesheet
  for (const payload of entries) {
    await createTimesheet(payload);
    console.log(`✅ Timesheet created for payload:`, payload);
  }
}
*/
// ------------------------------------------------------------------------------------------

/**
 * Deletes timesheet entries for the given testCaseIDs.
 * Only processes test cases with a `payloadFilterTimeEntry` field.
 *
 * @param {string[]} testCaseIDs  The list of test case IDs to process
 */

export const deleteTimeEntries = async (testCaseIDs = []) => {
  // bail out if nothing to do
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) {
    return;
  }

  // we only support one TC at a time now
  const [tcId] = testCaseIDs;

  // build path to the per‑TC JSON stub
  const filePath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);

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
  const actor = tcId === "TC92" ? "employee3" : "employee";

  for (const entry of entries) {
    // derive parent & name identifiers
    const { parent, name } = await filterTimesheetEntry(entry);

    console.log(`Deleting timesheet for TC ${tcId}: parent=${parent}, name=${name}`);

    await deleteTimesheet({ parent, name }, actor);

    // any special-case logging you still want
    if (entry.project_name === "TC02 Project") {
      console.warn(`RESPONSE OF DELETE TIMESHEET FOR TC02: ${entry.project_name}`);
    }
  }
};
/*
export const deleteTimeEntries = async (testCaseIDs = []) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) {
    return;
  }

  const sharedEmployeeData = await readJSONFile("../data/employee/shared-timesheet.json");
  const sharedManagerData = await readJSONFile(managerTeamDataFilePath);

  const extractEntries = (dataNode) =>
    Object.entries(dataNode || {})
      .filter(([key]) => key.startsWith("payloadFilterTimeEntry"))
      .map(([, value]) => value)
      .filter(Boolean);

  // Build an array of { tcId, entry } objects instead of just entries
  const entriesWithTC = testCaseIDs.flatMap((tcId) => {
    const empNode = sharedEmployeeData[tcId];
    const mgrNode = sharedManagerData[tcId];

    return [
      ...extractEntries(empNode).map((entry) => ({ tcId, entry })),
      ...extractEntries(mgrNode).map((entry) => ({ tcId, entry })),
    ];
  });

  for (const { tcId, entry } of entriesWithTC) {
    // filter to get the real parent/name
    const { parent, name } = await filterTimesheetEntry(entry);

    // log with test case context
    console.log(`Got parent and name from test case ${tcId} as: parent=${parent}, name=${name}`);

    await deleteTimesheet({ parent, name }, "employee");

    // optional special warning
    if (entry.project_name === "TC02 Project") {
      console.warn(`RESPONSE OF DELETE TIMESHEET FOR TC02: ${entry.project_name}`);
    }
  }
};
*/
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
  //console.log("\nGAP BETWEEN DATA\n");
  //console.dir(data, { depth: null, colors: true });

  // strip HTML from your input `description`
  const searchText = (description || "").replace(/<[^>]+>/g, "");

  for (const week of Object.values(data)) {
    for (const task of Object.values(week.tasks)) {
      if (task.subject !== subject) continue;

      // look for an entry whose no‑HTML description _exactly_ matches your searchText
      const match = (task.data || []).find((e) => {
        const noHtml = (e.description || "").replace(/<[^>]+>/g, "");
        console.log("NO HTML TEXT IS:", noHtml);
        return (
          noHtml === searchText && // exact match on full string
          e.project_name === project_name && // same project
          e.from_time.startsWith(from_time) // same day
        );
      });

      if (match) {
        console.warn("✅ MATCH FOUND FOR FILTER TIMESHEET ENTRY   :", match);
        return match;
      }
    }
  }

  return {}; // nothing matched
};
/*
export const filterTimesheetEntry = async ({ subject, description, project_name, from_time, employee, max_week }) => {

  console.warn(
    `FILTER TIME SHEET ENTRY GOT DETAILS FOR: \n SUBJECT : ${subject} \n description: ${description}\n project_name: ${project_name} \n from_time: ${from_time} \n employee: ${employee}\n \n max_week: ${max_week}\n `
  );
  const payload = { employee, start_date: from_time, max_week };
  const res = await getTimesheetDetails(payload);

  console.warn(`Response for FILTER TIMESHEET ENTRY FOR SUBJECT:${subject} is :     `);
  const jsonResponse = res && typeof res.json === "function" ? await res.json() : res;
  console.dir(jsonResponse, { depth: 10 });
  const data = jsonResponse.message.data;
console.warn(``)
  // Iterate over all weeks
  for (const weekData of Object.values(data)) {
    // Extract and iterate over all tasks
    for (const taskMetaData of Object.values(weekData.tasks)) {
      if (taskMetaData.subject !== subject) continue;

      // Debug all entries
      for (const e of taskMetaData.data || []) {
        const rawDescription = e.description || "";
        const plainDescription = rawDescription.replace(/<[^>]+>/g, "");

        console.log(`🔍 Checking timesheet entry:`, {
          description: plainDescription,
          from_time: e.from_time,
          project_name: e.project_name,
        });
      }

      // Try to find matching entry based on stripped description and other criteria
      const matchingEntry = (taskMetaData.data || []).find((e) => {
        const rawDescription = e.description || "";
        const plainDescription = rawDescription.replace(/<[^>]+>/g, "");

        return (
          plainDescription.toLowerCase().includes("TC") &&
          e.project_name === project_name &&
          e.from_time.startsWith(from_time)
        );
      });

      console.warn("✅ MATCHING ENTRY:", matchingEntry);
      if (matchingEntry) return matchingEntry;
    }
  }

  return {};
};
*/
// ------------------------------------------------------------------------------------------

/**
 * Creates projects for all testCaseIDs passed in.
 * Uses the in‑JS-module data, then writes out to JSON.
 */

export const createProjectForTestCases = async (testCaseIDs) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;
  const [tcId] = testCaseIDs;

  // per‑TC JSON stub path
  const stubPath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);

  // Read the whole stub object: { "TC4": { … } }
  const fullStub = await readJSONFile(stubPath);
  const entry = fullStub[tcId];
  if (!entry) {
    console.warn(`⚠️ No data at key "${tcId}" in ${stubPath}`);
    return;
  }

  if (!entry.payloadCreateProject) {
    console.warn(`⚠️ No payloadCreateProject for ${tcId}`);
    return;
  }

  // Create project
  const res = await createProject(entry.payloadCreateProject);
  if (!res.ok) {
    console.error(`Failed to create project for ${tcId}: ${res.statusText}`);
    return;
  }
  const json = await res.json();
  const projectId = json.data.name;
  const customCurrency = json.data.custom_currency;

  // Share, if needed
  if (Array.isArray(entry.payloadShareProject)) {
    for (const sharePayload of entry.payloadShareProject) {
      await shareProjectWithUser({ ...sharePayload, name: projectId });
    }
  }

  // Mutate the inner stub
  if (entry.payloadDeleteProject) {
    entry.payloadDeleteProject.projectId = projectId;
  }
  if (entry.payloadCreateTask) {
    entry.payloadCreateTask.project = projectId;
  }
  if (entry.payloadCalculateBillingRate) {
    Object.assign(entry.payloadCalculateBillingRate, {
      project: projectId,
      custom_currency_for_project: customCurrency,
    });
  }

  // **Write back** only the wrapped object { "TC4": entry }
  await writeDataToFile(stubPath, { [tcId]: entry });
  console.log(`✅ Updated stub for ${tcId}  in CREATE PROJECT (projectId=${projectId})`);
};

/*
export const createProjectForTestCases = async (testCaseIDs) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) {
    return;
  }
  const [tcId] = testCaseIDs;

  // per‑TC JSON stub path
  const stubPath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);

  // read only that one stub
  const entry = await readJSONFile(stubPath);
  if (!entry.payloadCreateProject) {
    console.warn(`⚠️ No payloadCreateProject for TC ${tcId}`);
    return;
  }

  // create project
  const res = await createProject(entry.payloadCreateProject);
  if (!res.ok) {
    console.error(`Failed to create project for ${tcId}: ${res.statusText}`);
    return;
  }
  const json = await res.json();
  const projectId = json.data.name;
  const customCurrency = json.data.custom_currency;

  // share
  if (Array.isArray(entry.payloadShareProject)) {
    for (const sharePayload of entry.payloadShareProject) {
      await shareProjectWithUser({ ...sharePayload, name: projectId });
    }
  }

  // wire up delete/calc payloads
  if (entry.payloadDeleteProject) {
    entry.payloadDeleteProject.projectId = projectId;
  }
  if (entry.payloadCreateTask) {
    entry.payloadCreateTask.project = projectId;
  }
  if (entry.payloadCalculateBillingRate) {
    Object.assign(entry.payloadCalculateBillingRate, {
      project: projectId,
      custom_currency_for_project: customCurrency,
    });
  }

  // now write back *only* the mutated stub
  await writeDataToFile(stubPath, entry);
};
*/
/*
export const createProjectForTestCases = async (testCaseIDs) => {
  const processTestCases = async (data, ids) => {
    for (const id of ids) {
      const entry = data[id];
      if (!entry || !entry.payloadCreateProject) continue;

      const res = await createProject(entry.payloadCreateProject);
      if (!res.ok) {
        console.error(`Failed to create project for ${id}: ${res.statusText}`);
        continue;
      }
      const json = await res.json();
      const projectId = json.data.name;
      const customCurrency = json.data.custom_currency;

      // share
      if (Array.isArray(entry.payloadShareProject)) {
        for (const sharePayload of entry.payloadShareProject) {
          await shareProjectWithUser({ ...sharePayload, name: projectId });
        }
      }

      // wire up delete/calc payloads
      if (entry.payloadDeleteProject) {
        entry.payloadDeleteProject.projectId = projectId;
      }
      if (entry.payloadCreateTask) {
        entry.payloadCreateTask.project = projectId;
      }
      if (entry.payloadCalculateBillingRate) {
        Object.assign(entry.payloadCalculateBillingRate, {
          project: projectId,
          custom_currency_for_project: customCurrency,
        });
      }
    }
  };

  // filter IDs against each dataset
  const empIDs = testCaseIDs.filter((id) => employeeTimesheetData[id]);
  const mgrTIDs = testCaseIDs.filter((id) => managerTaskData[id]);
  const mgrIDs = testCaseIDs.filter((id) => managerTeamData[id]);

  await processTestCases(employeeTimesheetData, empIDs);
  await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);

  await processTestCases(managerTaskData, mgrTIDs);
  await writeDataToFile(managerTaskDataFilePath, managerTaskData);

  await processTestCases(managerTeamData, mgrIDs);
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
};
*/
/**
 * Deletes projects for all testCaseIDs passed in.
 * Reads back the shared JSON, then deletes.
 */
export const deleteProjects = async (testCaseIDs = []) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) {
    return;
  }

  // 1) pull out the single ID
  const [tcId] = testCaseIDs;

  // 2) build path to its per‑TC stub
  const filePath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);

  // 3) read that stub
  const stub = await readJSONFile(filePath);
  const entry = stub[tcId];
  if (!entry) {
    console.warn(`⚠️ No data object found in ${tcId}.json`);
    return;
  }

  // 4) grab the projectId
  const projId = entry.payloadDeleteProject?.projectId;
  if (!projId) {
    console.warn(`⚠️ No payloadDeleteProject.projectId found for TC ${tcId}`);
    return;
  }

  // 5) delete it
  await deleteProject(projId);
  console.log(`🗑️  Deleted project ${projId} for TC ${tcId}`);
};

/*
export const deleteProjects = async (testCaseIDs) => {
  const employeeData = await readJSONFile(employeeTimesheetDataFilePath);
  const managerTeam = await readJSONFile(managerTeamDataFilePath);
  const managerTask = await readJSONFile(managerTaskDataFilePath);

  const allDataSets = [employeeData, managerTask, managerTeam];

  for (const data of allDataSets) {
    for (const id of testCaseIDs) {
      const projId = data[id]?.payloadDeleteProject?.projectId;
      if (projId) {
        await deleteProject(projId);
      }
    }
  }
};
*/
// ------------------------------------------------------------------------------------------

/**
 * Creates tasks for all testCaseIDs passed in.
 */
// helpers/taskHelper.js

export const createTaskForTestCases = async (testCaseIDs) => {
  // nothing to do if no ID provided
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // we only expect one ID per run
  const [tcId] = testCaseIDs;

  // resolve its stub file
  const stubPath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);

  // read the entire stub (wrapped under the TC key)
  const fullStub = await readJSONFile(stubPath);
  const entry = fullStub[tcId];
  if (!entry || !entry.payloadCreateTask) {
    console.warn(`⚠️ [${tcId}] no payloadCreateTask, skipping`);
    return;
  }

  // CREATE
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

  // LIKE
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
  console.log(`✏️  [${tcId}] stub updated at ${stubPath}`);
};
/*
export const createTaskForTestCases = async (testCaseIDs) => {
  // nothing to do if no ID provided
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // we only expect one ID per run
  const [tcId] = testCaseIDs;

  // resolve its stub file
  const stubPath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);

  // read the JSON stub
  const entry = await readJSONFile(stubPath);
  if (!entry || !entry.payloadCreateTask) {
    console.warn(`⚠️ [${tcId}] no payloadCreateTask, skipping`);
    return;
  }

  // CREATE
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

  // LIKE
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

  // persist the mutated stub
  await writeDataToFile(stubPath, entry);
  console.log(`✏️  [${tcId}] stub updated at ${stubPath}`);
};
*/
/*
export const createTaskForTestCases = async (testCaseIDs) => {
  const processTestCasesForTasks = async (data, ids) => {
    for (const id of ids) {
      const entry = data[id];
      if (!entry || !entry.payloadCreateTask) continue;

      let taskID;
      let taskSubject;

      // 1. create & update
      if (entry.payloadCreateTask) {
        const res = await createTask(entry.payloadCreateTask);
        if (!res || typeof res !== "object") {
          console.error(`Failed to create task for ${id}: Unexpected response format`);
        } else {
          taskID = res.data.name;
          taskSubject = entry.payloadCreateTask.subject;

          // store for deletion
          if (entry.payloadDeleteTask) {
            entry.payloadDeleteTask.taskID = taskID;
          }

          // optional update
          if (entry.payloadUpdateTask) {
            await updateTask(taskID, entry.payloadUpdateTask);
          }
        }
      }

      // 2. like
      if (entry.payloadLikeTask && taskID) {
        entry.payloadLikeTask.name = taskID;
        const response = await likeTask(taskID, entry.payloadLikeTask.role);
        if (response && typeof response === "object") {
          console.log(`Successfully liked task for ${testCaseIDs}`);
        } else {
          console.error(`Failed to like task for ${testCaseIDs}: Unexpected response format`);
        }
        // also push subject into TC12 if present
        if (data.TC12 && Array.isArray(data.TC12.tasks)) {
          data.TC12.tasks.push(taskSubject);
        }
      }

      // 3. wire up timesheet creation
      if (entry.payloadCreateTimesheet && taskID) {
        entry.payloadCreateTimesheet.task = taskID;
      }
    }
  };

  // filter incoming IDs against each dataset
  const empIDs = testCaseIDs.filter((id) => employeeTimesheetData[id]);
  const mgrTIDs = testCaseIDs.filter((id) => managerTaskData[id]);
  const mgrIDs = testCaseIDs.filter((id) => managerTeamData[id]);

  // run & persist
  await processTestCasesForTasks(employeeTimesheetData, empIDs);
  await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);

  await processTestCasesForTasks(managerTaskData, mgrTIDs);
  await writeDataToFile(managerTaskDataFilePath, managerTaskData);

  await processTestCasesForTasks(managerTeamData, mgrIDs);
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
};
*/
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
 * Deletes tasks for all provided testCaseIDs.
 * Reads the shared JSON files to lookup taskIDs, and
 * deletes each, using admin rights for specific cases.
 */
// helpers/taskHelper.js

export const deleteTasks = async (testCaseIDs) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const adminCases = new Set(["TC2", "TC92"]);

  for (const tcId of testCaseIDs) {
    const stubPath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);
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
        console.log(`🗑️  [${tcId}] deleted task ${taskID} as admin`);
      } else {
        await deleteTask(taskID);
        console.log(`🗑️  [${tcId}] deleted task ${taskID}`);
      }
    } catch (err) {
      console.error(`❌ [${tcId}] Failed to delete task ${taskID}: ${err.message}`);
    }
  }
};

/*
export const deleteTasks = async (testCaseIDs) => {
  // load the shared JSON data
  const employeeData = await readJSONFile("../data/employee/shared-timesheet.json");
  const managerTaskData = await readJSONFile("../data/manager/shared-task.json");
  const managerTeamData = await readJSONFile("../data/manager/shared-team.json");

  // IDs that require admin deletion
  const adminCases = new Set(["TC2", "TC92"]);

  for (const id of testCaseIDs) {
    // find the entry in one of the datasets
    const entry = employeeData[id] || managerTaskData[id] || managerTeamData[id];
    if (!entry) continue;

    const taskID = entry.payloadDeleteTask?.taskID;
    if (!taskID) continue;

    // delete with admin if needed
    if (adminCases.has(id)) {
      await deleteTask(taskID, "admin");
    } else {
      await deleteTask(taskID);
    }
  }
};
*/
// ------------------------------------------------------------------------------------------

/**
 * Calculates hourly billing rate of employee and billing rate of a project
 * for the provided testCaseIDs array.
 */
export const calculateHourlyBilling = async (testCaseIDs = []) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // 1) Fetch employee info once
  const empRes = await getEmployeeDetails(empID, "admin");
  const employee_CTC = empRes.data.ctc;
  const employee_currency = empRes.data.salary_currency;

  // 2) Loop through each TC
  for (const tcId of testCaseIDs) {
    const stubPath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);

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
      hourly_billing_rate = convertedCTC / 12 / 160;
    } else {
      hourly_billing_rate = employee_CTC / 12 / 160;
    }

    // 6) Fetch project financials
    const projRes = await getProjectDetails(ratePayload.project);
    const projJson = await projRes.json();

    ratePayload.total_billable_amount = projJson.data.total_billable_amount;
    ratePayload.total_costing_amount = projJson.data.total_costing_amount;
    ratePayload.hourly_billing_rate = hourly_billing_rate;

    // 7) Write it back wrapped under the TC key
    await writeDataToFile(stubPath, { [tcId]: entry });
    console.log(`✅ Updated billing for ${tcId} in ${stubPath}`);
  }
};
/*
export const calculateHourlyBilling = async (testCaseIDs) => {
  // constants for split calculations
  let monthly_billing_rate;
  let hourly_billing_rate;
  let employee_currency;
  let project_currency;
  let employee_CTC;
  let convertedCTC;

  // Fetch employee details once
  const empRes = await getEmployeeDetails(empID, "admin");
  employee_CTC = empRes.data.ctc;
  employee_currency = empRes.data.salary_currency;

  // Filter only test cases with billing payload
  const idsToProcess = testCaseIDs.filter(
    (id) => employeeTimesheetData[id] && employeeTimesheetData[id].payloadCalculateBillingRate
  );

  for (const testCaseID of idsToProcess) {
    const ratePayload = employeeTimesheetData[testCaseID].payloadCalculateBillingRate;
    project_currency = ratePayload.custom_currency_for_project;

    //If the employee currency and project currency differs
    if (employee_currency !== project_currency) {
      // convert the employee CTC to project currency
      const convertRes = await getExchangeRate(employee_currency, project_currency);
      convertedCTC = convertRes.message * employee_CTC;
      monthly_billing_rate = convertedCTC / 12;
      hourly_billing_rate = monthly_billing_rate / 160;
    } else {
      monthly_billing_rate = employee_CTC / 12;
      hourly_billing_rate = monthly_billing_rate / 160;
    }

    // fetch project details for financials
    const projRes = await getProjectDetails(ratePayload.project);
    const projJson = await projRes.json();
    const total_billable_amount = projJson.data.total_billable_amount;
    const total_costing_amount = projJson.data.total_costing_amount;

    // write values back into payload
    ratePayload.total_billable_amount = total_billable_amount;
    ratePayload.total_costing_amount = total_costing_amount;
    ratePayload.hourly_billing_rate = hourly_billing_rate;
  }

  // Persist updated shared data
  await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);
};
*/
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
  const mergedData = {
    ...employeeTimesheetData,
    ...managerTaskData,
    ...managerTeamData,
  };

  await deleteLeaveOfEmployee();
  await deleteEmployeeByName();
  await cleanUpProjects(mergedData);
  //await deleteUserGroupForEmployee();
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
