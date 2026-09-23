import { storeStorageState } from "../helpers/storageStateHelper";
import { createJSONFile, populateJsonStubs } from "../utils/fileUtils";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import {
  createTimeEntries,
  submitTimesheetForTestCases,
  updateTimeEntries,
  createProjectForTestCases,
  createTaskForTestCases,
  calculateHourlyBilling,
  readAndCleanAllOrphanData,
  createViewForTestCases,
  writeRunMarker,
} from "../helpers/timesheetHelper";
import { updateLeaveEntries } from "../helpers/leaveHelper";
import {
  createEmployees,
  createRevieweeForTestCases,
  createTimeEntriesForSeededEmployees,
  registerRevieweesInTeamRoster,
} from "../helpers/employeeHelper";
import { createUserGroupForEmployee } from "../helpers/teamTabHelper";
import { createAllocationsForTestCases } from "../helpers/resourceManagementHelpers";

const globalSetup = async () => {
  console.log("🚀 Starting global setup...");

  // 0) Discover active tests and extract TC IDs
  console.log("🔍 Discovering active tests via list-tests.js...");
  const projectRoot = path.resolve(__dirname, "..");
  let rawList = "[]";
  try {
    rawList = execSync("node scripts/list-tests.js", {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "inherit"],
    }).toString();
  } catch (err) {
    console.warn("⚠️ list-tests.js did not return any tests:", err.message);
  }

  let tests = [];
  try {
    tests = JSON.parse(rawList);
  } catch {
    tests = [];
  }

  const tcPattern = /TC(\d+):/g;
  const tcSet = new Set();
  tests.forEach(({ title }) => {
    let match;
    while ((match = tcPattern.exec(title)) !== null) {
      tcSet.add(`TC${match[1]}`);
    }
  });
  const allTCIds = Array.from(tcSet);
  console.log(`📑 Extracted TC IDs: ${allTCIds.join(", ")}`);

  // Persist TC IDs
  const tcJsonPath = path.join(projectRoot, "test-tc-ids.json");
  fs.writeFileSync(tcJsonPath, JSON.stringify(allTCIds, null, 2));
  console.log(`✅ TC ID list written to: ${tcJsonPath}`);

  // 1) Pre‑generate API auth states for all roles
  const roles = ["employee", "employee2", "employee3", "manager", "admin"];
  await Promise.all(roles.map((role) => storeStorageState(role, true)));

  // 2) Create and populate JSON stubs for each TC ID
  console.log("📁 Creating JSON stubs for each TC ID...");
  //Create json file to store array of task to be deleted
  await createJSONFile(
    path.resolve(__dirname, "../data/manager/tasks-to-delete.json"),
    [],
  ); // Create empty stub and populate

  const jsonDir = path.resolve(__dirname, "../data/json-files");
  await fs.promises.mkdir(jsonDir, { recursive: true });

  // Marks when this run began, so teardown's timesheet sweep can bound itself to
  // records this run created instead of deleting whatever it finds.
  await writeRunMarker(jsonDir);
  for (const tcId of allTCIds) {
    const filePath = path.join(jsonDir, `${tcId}.json`);
    await createJSONFile(filePath, { [tcId]: {} });
    await populateJsonStubs(jsonDir, [tcId]);
  }

  // Verify JSON files
  for (const tcId of allTCIds) {
    const filePath = path.join(jsonDir, `${tcId}.json`);
    const content = await fs.promises.readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    if (!data[tcId]) {
      throw new Error(`Missing data for ${tcId}`);
    }
  }

  // 3) Clean up orphan data
  await readAndCleanAllOrphanData();

  // 4) Generate data for each TC in sequence
  console.log("🛠 Generating test data per TC ID...");
  for (const tcId of allTCIds) {
    console.log(`➡️ Processing ${tcId}`);
    await createEmployees([tcId], jsonDir);
    await updateTimeEntries([tcId], jsonDir);
    // AFTER updateTimeEntries, not before: that step rebuilds the stub from the
    // imported data modules and writes it over whatever is on disk, so a pin
    // written earlier is silently lost and the timesheet lands on the default
    // shared employee instead.
    await createRevieweeForTestCases([tcId], jsonDir);
    await createProjectForTestCases([tcId], jsonDir);
    await createViewForTestCases([tcId], jsonDir);
    await createTaskForTestCases([tcId], jsonDir);
    // After the task exists - that is what the seeded employees book against.
    await createTimeEntriesForSeededEmployees([tcId], jsonDir);
    await createAllocationsForTestCases([tcId], jsonDir);
    await createTimeEntries([tcId], jsonDir);
    // Must follow createTimeEntries - there is nothing to submit before it.
    await submitTimesheetForTestCases([tcId], jsonDir);
    await calculateHourlyBilling([tcId], jsonDir);
    await updateLeaveEntries([tcId], jsonDir);
    await createUserGroupForEmployee([tcId], jsonDir);
  }

  // After the loop, not inside it: seeding walks the TC ids in order and TC53's
  // own turn rewrites its stub from the static data module, wiping any reviewee
  // registered before that point.
  await registerRevieweesInTeamRoster(allTCIds, jsonDir);

  console.log(
    "✅ Data generation completed for all TC IDs! Global setup done.",
  );
};

export default globalSetup;
