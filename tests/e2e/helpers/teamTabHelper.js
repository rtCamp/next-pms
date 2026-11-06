import path from "path";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { getShortFormattedDate } from "../utils/dateUtils";
import {
  createUserGroup,
  deleteUserGroup,
} from "../utils/api/userGroupRequests";
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
    let randomString = [...Array(5)]
      .map(() => String.fromCharCode(97 + Math.floor(Math.random() * 26)))
      .join("");

    const name = `UserGroup-${day}${month}-${randomString}`;

    try {
      await createUserGroup({ user: emp3, name });

      // update stub payloads
      entry.payloadCreateUserGroup.user_group_members[0].user = emp3;
      entry.payloadCreateUserGroup.__newname = name;
      entry.payloadDeleteUserGroup.name = name;

      // write back updated stub
      await writeDataToFile(stubPath, { [tcId]: entry });
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
export const deleteUserGroupForEmployee = async (testCaseIDs, jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);
    let fullStub;

    try {
      fullStub = await readJSONFile(stubPath);
    } catch (e) {
      console.warn(`⚠️ Failed to read stub for ${tcId}: ${e.message}`);
      continue;
    }

    const entry = fullStub[tcId];
    if (!entry || !entry.payloadDeleteUserGroup) {
      console.warn(`Skipping ${tcId}: no payload for deleting user group`);
      continue;
    }

    const groupName = entry.payloadDeleteUserGroup.name;
    if (!groupName) {
      console.warn(`⚠️ No group name found for ${tcId} in ${stubPath}`);
      continue;
    }

    try {
      console.warn(
        `Attempting to delete user group '${groupName}' for ${tcId}`,
      );
      const { deleted } = await deleteUserGroup(groupName);
      if (deleted)
        console.log(`🗑  Deleted user group '${groupName}' for ${tcId}`);
    } catch (e) {
      console.warn(
        `❌ Failed to delete group '${groupName}' for ${tcId}: ${e.message}`,
      );
    }
  }
};
