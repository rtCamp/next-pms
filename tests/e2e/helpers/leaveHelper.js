import path from "path";
import fs from "fs";
import { getWeekdayName, getDateForWeekday, getFormattedDate } from "../utils/dateUtils";
import { getLeaves, getLeaveDetails, actOnLeave } from "../utils/api/leaveRequests";
//import employeeTimesheetData from "../data/employee/timesheet";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";

// Load env variables
const empID = process.env.EMP_ID;

// Define file paths for shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file
// Path to where your TC‑JSON files live
const JSON_DIR = path.resolve(__dirname, "../data/json-files");
// ------------------------------------------------------------------------------------------

/**
 * Updates leave-entry filters for provided testCaseIDs (e.g. TC13).
 * Sets from/to dates to today and employee to empID.
 */
export const updateLeaveEntries = async (testCaseIDs = [],jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
    //const stubPath = path.join(JSON_DIR, `${tcId}.json`);
    const stubPath = path.join(jsonDir, `${tcId}.json`);

    // 1) Read the wrapped stub { "TCn": entry }
    const fullStub = await readJSONFile(stubPath);
    const entry    = fullStub[tcId];
    if (!entry) {
      console.warn(`⚠️ No data under key "${tcId}" in ${stubPath}`);
      continue;
    }

    // 2) Skip if this TC has no leave‑filter payload
    const filter = entry.payloadFilterLeaveEntry;
    if (!filter) continue;

    // 3) Mutate fields
    const todayName     = getWeekdayName(new Date());
    entry.cell.col     = todayName;
    const formattedDate = getFormattedDate(getDateForWeekday(todayName));
    filter.from_date   = formattedDate;
    filter.to_date     = formattedDate;
    filter.employee    = process.env.EMP_ID;

    // 4) Write back wrapped under the same TC key
    await writeDataToFile(stubPath, { [tcId]: entry });
    //console.log(`✅ Updated leave filter for ${tcId} in ${stubPath}`);
  }
};
/*
export const updateLeaveEntries = async (testCaseIDs) => {
  // only process IDs that have payloadFilterLeaveEntry
  const idsToUpdate = testCaseIDs.filter(
    id => employeeTimesheetData[id] && employeeTimesheetData[id].payloadFilterLeaveEntry
  );

  for (const id of idsToUpdate) {
    const entry = employeeTimesheetData[id];
    // dynamic cell update
    const todayName = getWeekdayName(new Date());
    entry.cell.col = todayName;
    const formattedDate = getFormattedDate(getDateForWeekday(todayName));

    // update filter payload
    const filter = entry.payloadFilterLeaveEntry;
    filter.from_date = formattedDate;
    filter.to_date   = formattedDate;
    filter.employee  = empID;
  }

  // persist all changes
  await writeDataToFile(employeeTimesheetDataFilePath, employeeTimesheetData);
};
*/
/**
 * Rejects leave entries for provided testCaseIDs.
 * Reads the shared JSON, fetches matching leaves, and rejects them.
 */
export const rejectLeaveEntries = async (testCaseIDs = [], jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
    //const stubPath = path.join(JSON_DIR, `${tcId}.json`);
    const stubPath = path.join(jsonDir, `${tcId}.json`);

    // 1) Read the wrapped stub { "TCn": entry }
    let fullStub;
    try {
      fullStub = await readJSONFile(stubPath);
    } catch (err) {
      console.warn(`⚠️ Could not read stub for ${tcId}: ${err.message}`);
      continue;
    }

    const entry = fullStub[tcId];
    if (!entry) {
      console.warn(`⚠️ No data under key "${tcId}" in ${stubPath}`);
      continue;
    }

    // 2) Skip if this TC has no leave‑filter payload
    const filter = entry.payloadFilterLeaveEntry;
    if (!filter) {
      console.warn(`⚠️ No payloadFilterLeaveEntry for ${tcId}`);
      continue;
    }

    try {
      // 3) Fetch matching leaves and pick the first
      const leavesRes = await getLeaves(filter);
      const firstLeave = leavesRes?.data?.[0];
      if (!firstLeave?.name) {
        console.warn(`⚠️ No leave entries found for ${tcId}`);
        continue;
      }

      // 4) Get leave details and reject
      const detailsRes = await getLeaveDetails(firstLeave.name);
      await actOnLeave({ action: "Reject", leaveDetails: detailsRes.data });

      //console.log(`✅ Rejected leave for ${tcId} (leave name: ${firstLeave.name})`);
    } catch (err) {
      console.error(`❌ Failed to reject leave for ${tcId}: ${err.message}`);
    }
  }
};
/*
export const rejectLeaveEntries = async (testCaseIDs) => {
  // reload shared data
  const sharedData = await readJSONFile(employeeTimesheetDataFilePath);
  const idsToReject = testCaseIDs.filter(
    id => sharedData[id] && sharedData[id].payloadFilterLeaveEntry
  );

  for (const id of idsToReject) {
    const filter = sharedData[id].payloadFilterLeaveEntry;
    const leavesRes = await getLeaves(filter);
    const first = leavesRes?.data?.[0];
    if (!first?.name) continue;

    // get details & reject
    const detailsRes = await getLeaveDetails(first.name);
    await actOnLeave({ action: "Reject", leaveDetails: detailsRes.data });
  }
};
*/