// playwright.fixture.cjs
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
const { createJSONFile, populateJsonStubs } = require("./utils/fileUtils");

// add a quick verify‐load log
console.log("🔥 loaded playwright.fixture.cjs");


const test = base.extend({
  
  testCaseIDs: async ({}, use, testInfo) => {
    const m = testInfo.title.match(/\bTC\d+\b/);
    // wrap the match in an array (or empty array if none):
    await use(m ? [m[0]] : []);
  },
});

// Directory where per-TC JSON stubs live
const jsonDir = path.resolve(__dirname, "data", "json-files");

// Helper to ensure stub file exists
async function ensureJsonStub(tc) {
  const filePath = path.join(jsonDir, `${tc}.json`);
  await createJSONFile(filePath);
  try {
    await fs.access(filePath);
    console.log(`✅ Verified JSON stub for ${tc} at ${filePath}`);
  } catch (err) {
    throw new Error(`❌ Cannot access JSON stub for ${tc}: ${err.message}`);
  }
}
test.beforeEach(async ({ testCaseIDs }) => {
  if (!testCaseIDs || testCaseIDs.length === 0) return;
  console.warn("STARTED FIXTURE: BEFORE EACH");

  // Ensure output directory exists
  await fs.mkdir(jsonDir, { recursive: true });

  // STEP 0: create + verify JSON stubs per TC
  for (const tc of testCaseIDs) {
    await ensureJsonStub(tc);
  }
  // Populate each stub with data from your JS payload modules
  await populateJsonStubs(jsonDir, testCaseIDs);

  // ── STEP 1: now that per‑TC files exist, run your normal setup helpers ─────────
  await createEmployees(testCaseIDs);
  await updateTimeEntries(testCaseIDs);
  await createProjectForTestCases(testCaseIDs);
  await createTaskForTestCases(testCaseIDs);
  await createTimeEntries(testCaseIDs);
  await calculateHourlyBilling(testCaseIDs);
  await updateLeaveEntries(testCaseIDs);
  await randomApprovalStatus(testCaseIDs);
  await createUserGroupForEmployee(testCaseIDs);
  // ── END STEP 1 ───────────────────────────────────────────────────────────────

  console.warn("ENDED FIXTURE: BEFORE EACH");
});

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
  // optionally: await readAndCleanAllOrphanData();
});

module.exports = { test, expect, devices };
