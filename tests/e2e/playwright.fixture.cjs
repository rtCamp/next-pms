const { test: base, expect, devices } = require("@playwright/test");
const path = require("path");
const fs = require("fs").promises;
const {
  createTimeEntries,
  updateTimeEntries,
  createProjectForTestCases,
  createTaskForTestCases,
  calculateHourlyBilling,
  readAndCleanAllOrphanData,
  deleteTimeEntries,
  deleteTasks,
  deleteProjects,
} = require("./helpers/timesheetHelper");
const {
  rejectLeaveEntries,
  updateLeaveEntries,
} = require("./helpers/leaveHelper");
const {
  createEmployees,
  deleteEmployees,
} = require("./helpers/employeeHelper");
const {
  randomApprovalStatus,
  createUserGroupForEmployee,
  deleteUserGroupForEmployee,
} = require("./helpers/teamTabHelper");
const { createJSONFilePerTC, populateJsonStubs } = require("./utils/fileUtils");
const { storeStorageState } = require("./helpers/storageStateHelper");

// add a quick verify‐load log\console.log("🔥 loaded playwright.fixture.cjs");

// Directory where per-TC JSON stubs live
const jsonDir = path.resolve(__dirname, "data", "json-files");

// Helper to ensure stub file exists
async function ensureJsonStub(tc) {
  const filePath = path.join(jsonDir, `${tc}.json`);
  console.log(`🔍 Attempting to create: ${filePath}`);
  await createJSONFilePerTC(filePath);
  try {
    await fs.access(filePath);
    console.log(`✅ Verified JSON stub for ${tc} at ${filePath}`);
  } catch (err) {
    console.error(`❌ File still doesn't exist: ${filePath}`);
    console.error(`❌ Error: ${err.message}`);
    throw new Error(`Cannot access JSON stub for ${tc}: ${err.message}`);
  }
}

const test = base.extend({
  // Worker-scoped fixture: generate a unique storageState per role per worker
  authState: [
    async ({}, use, testInfo) => {
      const role = testInfo.project.metadata.TEST_ROLE;
      if (!role)
        throw new Error("`metadata.TEST_ROLE` must be set on the project");

      const workerIndex = testInfo.workerIndex;
      const fileName = `${role}-w${workerIndex}.json`;
      const outPath = path.resolve(__dirname, "./auth", fileName);
      try {
        await fs.access(outPath);
      } catch {
        // Generate storage state with CSRF (isApi=false)
        await storeStorageState(role, false, outPath);
      }
      await use(outPath);
    },
    { scope: "worker" },
  ],

  // Override built-in storageState to use our worker-scoped authState
  storageState: async ({ authState }, use) => {
    await use(authState);
  },

  // Test-case ID extraction for beforeEach/afterEach data setup/teardown
  testCaseIDs: async ({}, use, testInfo) => {
    console.log("🔍 raw title:", JSON.stringify(testInfo.title));
    const m = testInfo.title.match(/\bTC(\d+):/);
    console.log("   → regex match:", m);
    await use(m ? [`TC${m[1]}`] : []);
  },
});

// Per-test setup: JSON stubs and test data
test.beforeEach(async ({ testCaseIDs }) => {
  console.warn("💡 beforeEach IDs:", testCaseIDs);
  if (!testCaseIDs || testCaseIDs.length === 0) return;
  console.warn("STARTED FIXTURE: BEFORE EACH");

  await fs.mkdir(jsonDir, { recursive: true });
  for (const tc of testCaseIDs) {
    await ensureJsonStub(tc);
  }
  await populateJsonStubs(jsonDir, testCaseIDs);

  // ── STEP 1: run setup helpers ─────────
  await createEmployees(testCaseIDs);
  await updateTimeEntries(testCaseIDs);
  await createProjectForTestCases(testCaseIDs);
  await createTaskForTestCases(testCaseIDs);
  await createTimeEntries(testCaseIDs);
  await calculateHourlyBilling(testCaseIDs);
  await updateLeaveEntries(testCaseIDs);
  await randomApprovalStatus(testCaseIDs);
  await createUserGroupForEmployee(testCaseIDs);
  // ── END STEP 1 ────────────────────────

  console.warn("ENDED FIXTURE: BEFORE EACH");
});

// Per-test teardown
test.afterEach(async ({ testCaseIDs }) => {
  if (!testCaseIDs) return;
  console.warn("STARTED FIXTURE: AFTER EACH");

  await deleteEmployees(testCaseIDs);
  await deleteTimeEntries(testCaseIDs);
  await deleteTasks(testCaseIDs);
  await deleteProjects(testCaseIDs);
  await rejectLeaveEntries(testCaseIDs);
  await deleteUserGroupForEmployee(testCaseIDs);

  console.warn("ENDED FIXTURE: AFTER EACH");
});

module.exports = { test, expect, devices };
