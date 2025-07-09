import path from "path";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
//import managerTeamData from "../data/manager/team";

import { getFormattedDate, getDateForWeekday, getShortFormattedDate } from "../utils/dateUtils";
import { getRandomValue } from "../utils/stringUtils";
import { deleteEmployee } from "../utils/api/employeeRequests";
import { submitTimesheetForApproval } from "./timesheetHelper";
import { actOnTimesheet } from "../utils/api/timesheetRequests";
import { createUserGroup, deleteUserGroup } from "../utils/api/userGroupRequests";

// Path to persist shared JSON
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json");
// Load env vars
const empID3 = process.env.EMP3_EMAIL;
// Directory where per‑TC JSON stubs live
const jsonDir = path.resolve(__dirname, "../data/json-files");

/**
 * Randomly assigns and acts on approval status for provided testCaseIDs.
 * @param {string[]} testCaseIDs  IDs to process in managerTeamData
 * @param {string[]} approvalOptions  possible statuses, defaults to pending/rejected
 */
export const randomApprovalStatus = async (
  testCaseIDs,
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
    console.log(`✅ Updated approval status for ${tcId} in ${stubPath}`);
  }
};
/*
export const randomApprovalStatus = async (
  testCaseIDs,
  approvalOptions = ["Approval Pending", "Partially Rejected"]
) => {
  // operate on in-memory JS module
  const data = managerTeamData;
  const randomStatus = getRandomValue(approvalOptions);
  console.warn(`Selected RANDOM Approval Status: ${randomStatus}`);

  for (const id of testCaseIDs) {
    const entry = data[id];
    if (!entry?.payloadApprovalStatus) {
      console.warn(`Skipping ${id}: no payloadApprovalStatus`);
      continue;
    }

    // assign status
    entry.payloadApprovalStatus.approvalStatus = randomStatus;

    // submit for approval
    await submitTimesheetForApproval(
      entry.payloadApprovalStatus.empId,
      entry.payloadApprovalStatus.managerID,
      entry.payloadApprovalStatus.employeeAPI
    );
    switch (randomStatus) {
      case "Approval Pending":
        console.warn("CASE: Approval Pending");
        break;

      case "Partially Rejected":
        console.warn("CASE: Partially Rejected");
        //Convert the timesheet entry day to a proper date
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
  }

  // write mutated JS data to JSON
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
};
*/
/**
 * Deletes created employees for provided testCaseIDs.
 * @param {string[]} testCaseIDs  IDs with createdEmployees array
 */
export const deleteEmployees = async (testCaseIDs = []) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];
    if (!entry?.createdEmployees) continue;

    for (const emp of entry.createdEmployees) {
      if (!emp.name) continue;
      try {
        await deleteEmployee(emp.name, "admin");
        console.log(`✅ Deleted employee ${emp.name} for ${tcId}`);
      } catch (err) {
        console.error(`❌ Error deleting ${emp.name} for ${tcId}: ${err.message}`);
      }
    }

    // Persist the stub (preserving the TC wrapper)
    await writeDataToFile(stubPath, { [tcId]: entry });
  }
};
/*
export const deleteEmployees = async (testCaseIDs) => {
  const sharedData = await readJSONFile(managerTeamDataFilePath);

  for (const id of testCaseIDs) {
    const entry = sharedData[id];
    if (!entry?.createdEmployees) continue;

    for (const emp of entry.createdEmployees) {
      if (emp.name) {
        try {
          await deleteEmployee(emp.name, "admin");
          console.log(`Deleted employee: ${emp.name}`);
        } catch (err) {
          console.error(`Error deleting ${emp.name}: ${err.message}`);
        }
      }
    }
  }
};
*/
/**
 * Creates a user group for provided testCaseID.
 * @param {string[]} testCaseIDs  IDs to process
 */
export const createUserGroupForEmployee = async (testCaseIDs) => {
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
      console.log(`✅ Created group '${name}' for '${emp3}' on ${tcId}`);

      // update stub payloads
      entry.payloadCreateUserGroup.user_group_members[0].user = emp3;
      entry.payloadCreateUserGroup.__newname = name;
      entry.payloadDeleteUserGroup.name = name;

      // write back updated stub
      await writeDataToFile(stubPath, { [tcId]: entry });
      console.log(`✏️  Updated user-group stub for ${tcId} in ${stubPath}`);
    } catch (err) {
      console.error(`Failed to create user group for ${tcId}: ${err.message}`);
    }
  }
};
/*
export const createUserGroupForEmployee = async (testCaseIDs) => {
  if (!empID3) {
    console.error("EMP3_EMAIL environment variable is not defined.");
    return;
  }
  const sharedData = await readJSONFile(managerTeamDataFilePath);

  for (const id of testCaseIDs) {
    const entry = sharedData[id];
    if (!entry?.payloadCreateUserGroup) continue;

    // build group name
    const shortDate = getShortFormattedDate(new Date()); // e.g. "Jun 11"
    const [month, day] = shortDate.split(" ");
    const name = `UserGroup-${day}${month}`;

    try {
      await createUserGroup({ user: empID3, name });
      console.log(`Created group '${name}' for '${empID3}'`);

      // update data
      entry.payloadCreateUserGroup.user_group_members[0].user = empID3;
      entry.payloadCreateUserGroup.__newname = name;
      entry.payloadDeleteUserGroup.name = name;
    } catch (err) {
      console.error(`Failed to create user group: ${err.message}`);
    }
  }

  await writeDataToFile(managerTeamDataFilePath, sharedData);
};
*/
/**
 * Deletes user groups for provided testCaseIDs.
 * @param {string[]} testCaseIDs  IDs to process
 */
export const deleteUserGroupForEmployee = async (testCaseIDs) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];
    if (!entry || !entry.payloadDeleteUserGroup) {
      console.warn(`Skipping ${tcId}: no payloadDeleteUserGroup`);
      continue;
    }

    const groupName = entry.payloadDeleteUserGroup.name;
    try {
      await deleteUserGroup(groupName);
      console.log(`✅ Deleted user group '${groupName}' for ${tcId}`);
    } catch (err) {
      const isNotFound = err?.response?.status === 404 || err?.message?.includes("404");
      if (isNotFound) {
        console.warn(`⚠️ No group to delete for '${groupName}' in ${tcId}`);
      } else {
        console.error(`❌ Failed to delete user group '${groupName}' for ${tcId}: ${err.message}`);
      }
    }
  }
};
/*
export const deleteUserGroupForEmployee = async (testCaseIDs) => {
  const sharedData = await readJSONFile(managerTeamDataFilePath);

  for (const id of testCaseIDs) {
    const entry = sharedData[id];
    const groupName = entry?.payloadDeleteUserGroup?.name;
    if (!groupName) {
      console.warn(`Skipping ${id}: no delete payload for deletion of user group`);
      continue;
    }

    try {
      await deleteUserGroup(groupName);
      console.log(`✅ Successfully deleted user group: ${groupName}`);
    } catch (err) {
      const isNotFound = err?.response?.status === 404 || err?.message?.includes("404");
      if (isNotFound) {
        console.warn(`⚠️ No group to delete for '${groupName}' in ${tcId}`);
      } else {
        console.error(`❌ Failed to delete user group '${groupName}' for ${tcId}: ${err.message}`);
      }
    }
  }
};
*/
