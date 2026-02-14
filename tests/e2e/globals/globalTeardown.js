import path from "path";
import fs from "fs";
import {
  deleteByTaskName,
  readAndCleanAllOrphanData,
} from "../helpers/timesheetHelper";
import { deleteUserGroupForEmployee } from "../helpers/teamTabHelper";
// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  // Locate and read test-tc-ids.json
  const projectRoot = path.resolve(__dirname, "..");
  const tcJsonPath = path.join(projectRoot, "test-tc-ids.json");

  let allTCIds = [];
  try {
    const rawTcs = await fs.promises.readFile(tcJsonPath, "utf-8");
    allTCIds = JSON.parse(rawTcs);
    console.log(`🧹 Loaded TC IDs for teardown: ${allTCIds.join(", ")}`);
  } catch (err) {
    console.warn("⚠️ Could not load TC IDs:", err.message);
  }

  //Clean up Data
  await deleteByTaskName();
  await readAndCleanAllOrphanData();

  //Pass allTCIds to cleanup function
  await deleteUserGroupForEmployee(
    allTCIds,
    path.resolve(projectRoot, "data/json-files"),
  );
};

export default globalTeardown;
