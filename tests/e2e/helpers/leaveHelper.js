import path from "path";
import { getWeekdayName, getDateForWeekday, getFormattedDate } from "../utils/dateUtils";
import { getLeaves, getLeaveDetails, actOnLeave } from "../utils/api/leaveRequests";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";

// ------------------------------------------------------------------------------------------
/**
 * Updates leave-entry filters for provided testCaseIDs (e.g. TC13).
 * Sets from/to dates to today and employee to empID.
 */
export const updateLeaveEntries = async (testCaseIDs = [], jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);

    // 1) Read the wrapped stub { "TCn": entry }
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];
    if (!entry) {
      console.warn(`⚠️ No data under key "${tcId}" in ${stubPath}`);
      continue;
    }

    // 2) Skip if this TC has no leave‑filter payload
    const filter = entry.payloadFilterLeaveEntry;
    if (!filter) continue;

    // 3) Mutate fields
    const todayName = getWeekdayName(new Date());
    entry.cell.col = todayName;
    const formattedDate = getFormattedDate(getDateForWeekday(todayName));
    filter.from_date = formattedDate;
    filter.to_date = formattedDate;
    filter.employee = process.env.EMP_ID;

    // 4) Write back wrapped under the same TC key
    await writeDataToFile(stubPath, { [tcId]: entry });
    //console.log(`✅ Updated leave filter for ${tcId} in ${stubPath}`);
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Rejects leave entries for provided testCaseIDs.
 * Reads the shared JSON, fetches matching leaves, and rejects them.
 */
export const rejectLeaveEntries = async (testCaseIDs = [], jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
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
