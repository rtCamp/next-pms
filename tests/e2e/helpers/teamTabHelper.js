import path from "path";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { getFormattedDate, getDateForWeekday, getShortFormattedDate } from "../utils/dateUtils";
import { getRandomValue } from "../utils/stringUtils";
import { deleteEmployee } from "../utils/api/employeeRequests";
import { submitTimesheetForApproval } from "./timesheetHelper";
import { actOnTimesheet } from "../utils/api/timesheetRequests";
import { createUserGroup, deleteUserGroup } from "../utils/api/userGroupRequests";
// ------------------------------------------------------------------------------------------

/**
 * Randomly assigns and acts on approval status for provided testCaseIDs.
 * @param {string[]} testCaseIDs  IDs to process in managerTeamData
 * @param {string[]} approvalOptions  possible statuses, defaults to pending/rejected
 */
export const randomApprovalStatus = async (
  testCaseIDs,
  jsonDir,
  approvalOptions = ["Approval Pending", "Partially Rejected"]
) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);

    // Read the entire stub { "TCn": entry }
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];
    if (!entry) {
      console.warn(`⚠️ No data under key "${tcId}" in ${stubPath}`);
      continue;
    }

    // Skip if no approval payload
    if (!entry.payloadApprovalStatus) {
      console.warn(`Skipping ${tcId}: no payloadApprovalStatus`);
      continue;
    }

    // Select a random status
    const randomStatus = getRandomValue(approvalOptions);
    console.warn(`Selected RANDOM Approval Status for ${tcId}: ${randomStatus}`);

    // Assign status
    entry.payloadApprovalStatus.approvalStatus = randomStatus;

    // Submit for approval
    await submitTimesheetForApproval(
      entry.payloadApprovalStatus.empId,
      entry.payloadApprovalStatus.managerID,
      entry.payloadApprovalStatus.employeeAPI
    );

    // Additional actions based on status
    switch (randomStatus) {
      case "Approval Pending":
        console.warn(`CASE [${tcId}]: Approval Pending`);
        break;

      case "Partially Rejected":
        console.warn(`CASE [${tcId}]: Partially Rejected`);
        // Convert the timesheet entry day to a proper date
        const formatted = getFormattedDate(getDateForWeekday(entry.cell.col));

        await actOnTimesheet({
          dates: [formatted],
          employee: entry.payloadApprovalStatus.empId,
          note: "Partial rejecting timesheet via API",
          status: "Rejected",
        });
        break;

      default:
        console.warn(`Unhandled approval status: ${randomStatus}`);
    }

    // Persist mutated stub, wrapped under its own TC key
    await writeDataToFile(stubPath, { [tcId]: entry });
    //console.log(`✅ Updated approval status for ${tcId} in ${stubPath}`);
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Creates a user group for provided testCaseID.
 * @param {string[]} testCaseIDs  IDs to process
 */
export const createUserGroupForEmployee = async (testCaseIDs, jsonDir) => {
  const emp3 = process.env.EMP3_EMAIL;
  if (!emp3) {
    console.error("EMP3_EMAIL environment variable is not defined.");
    return;
  }
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];
    if (!entry || !entry.payloadCreateUserGroup) {
      console.warn(`Skipping ${tcId}: no payloadCreateUserGroup`);
      continue;
    }

    // build group name based on today
    const shortDate = getShortFormattedDate(new Date()); // e.g. "Jun 11"
    const [month, day] = shortDate.split(" ");
    const name = `UserGroup-${day}${month}`;

    try {
      await createUserGroup({ user: emp3, name });
      //console.log(`✅ Created group '${name}' for '${emp3}' on ${tcId}`);

      // update stub payloads
      entry.payloadCreateUserGroup.user_group_members[0].user = emp3;
      entry.payloadCreateUserGroup.__newname = name;
      entry.payloadDeleteUserGroup.name = name;

      // write back updated stub
      await writeDataToFile(stubPath, { [tcId]: entry });
      //console.log(`✏️  Updated user-group stub for ${tcId} in ${stubPath}`);
    } catch (err) {
      console.error(`Failed to create user group for ${tcId}: ${err.message}`);
    }
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Always attempts to delete today's user group, named "UserGroup-<day><month>",
 * e.g. if today is June 11, name = "UserGroup-11Jun".
 */
export const deleteUserGroupForEmployee = async () => {
  // 1) Generate the group name based on today's date
  const shortDate = getShortFormattedDate(new Date()); // e.g. "Jun 11"
  const [month, day] = shortDate.split(" ");
  const groupName = `UserGroup-${day}${month}`;

  // 2) Attempt deletion
  try {
    await deleteUserGroup(groupName);
    console.log(`✅ Deleted user group '${groupName}'`);
  } catch (err) {
    const isNotFound =
      err?.response?.status === 404 || (typeof err.message === "string" && err.message.includes("404"));

    if (isNotFound) {
      console.warn(`⚠️ No user group found to delete for '${groupName}' (404)`);
    } else {
      console.error(`❌ Failed to delete user group '${groupName}': ${err.message}`);
    }
  }
};
