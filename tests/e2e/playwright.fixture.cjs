const { test: base, expect, devices } = require("@playwright/test");
const path = require("path");
const fs = require("fs").promises;
const {
  createTimeEntries,
  updateTimeEntries,
  createProjectForTestCases,
  createTaskForTestCases,
  calculateHourlyBilling,
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
const { storeStorageState } = require("./helpers/storageStateHelper");

// add a quick verify‑load log
console.log("🔥 loaded playwright.fixture.cjs");

// Define the single shared JSON directory
const SHARED_JSON_DIR = path.resolve(__dirname, "data", "json-files");

// Helper to extract test case IDs from test title
function extractTestCaseIDs(testTitle) {
  console.log("🔍 Extracting test case IDs from title:", JSON.stringify(testTitle));
  
  // More comprehensive regex to catch different formats
  const patterns = [
    /TC(\d+)/i,           // TC42, tc42
  ];
  
  let ids = [];
  for (const pattern of patterns) {
    const m = testTitle.match(pattern);
    if (m) {
      ids = [`TC${m[1]}`];
      console.log(`   → regex match with pattern ${pattern}:`, m);
      break;
    }
  }
  
  console.log("   → extracted IDs:", ids);
  return ids;
}

// Helper to verify JSON file exists and is readable
async function verifyJsonFile(filePath, tcId) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data[tcId]) {
      throw new Error(`JSON file missing data for key "${tcId}"`);
    }
    
    console.log(`✅ Verified JSON file exists: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`❌ JSON file verification failed: ${filePath}`, err.message);
    throw new Error(`JSON file not ready: ${filePath} - ${err.message}`);
  }
}

// Helper to run test data setup
async function runTestDataSetup(testCaseIDs) {
  console.log("🔧 Running test data setup for:", testCaseIDs);
  
  try {
    // All functions now use the shared JSON directory
    await createEmployees(testCaseIDs, SHARED_JSON_DIR);
    await updateTimeEntries(testCaseIDs, SHARED_JSON_DIR);
    await createProjectForTestCases(testCaseIDs, SHARED_JSON_DIR);
    await createTaskForTestCases(testCaseIDs, SHARED_JSON_DIR);
    await createTimeEntries(testCaseIDs, SHARED_JSON_DIR);
    await calculateHourlyBilling(testCaseIDs, SHARED_JSON_DIR);
    await updateLeaveEntries(testCaseIDs, SHARED_JSON_DIR);
    await randomApprovalStatus(testCaseIDs, SHARED_JSON_DIR);
    await createUserGroupForEmployee(testCaseIDs, SHARED_JSON_DIR);
    
    console.log("✅ Test data setup completed successfully");
  } catch (error) {
    console.error("❌ Test data setup failed:", error.message);
    throw error;
  }
}

// Helper to run test data teardown
async function runTestDataTeardown(testCaseIDs) {
  console.log("🧹 Running test data teardown for:", testCaseIDs);
  
  try {
    await deleteEmployees(testCaseIDs, SHARED_JSON_DIR);
    await deleteTimeEntries(testCaseIDs, SHARED_JSON_DIR);
    await deleteTasks(testCaseIDs, SHARED_JSON_DIR);
    await deleteProjects(testCaseIDs, SHARED_JSON_DIR);
    await rejectLeaveEntries(testCaseIDs, SHARED_JSON_DIR);
    await deleteUserGroupForEmployee(testCaseIDs, SHARED_JSON_DIR);
    
    console.log("✅ Test data teardown completed successfully");
  } catch (error) {
    console.error("❌ Test data teardown failed:", error.message);
    // Don't throw here to avoid masking test failures
  }
}

const test = base.extend({
  // Worker-scoped fixture: generate a unique storageState per role per worker
  authState: [
    async ({}, use, testInfo) => {
      const role = testInfo.project.metadata.TEST_ROLE;
      if (!role) {
        throw new Error("`metadata.TEST_ROLE` must be set on the project");
      }

      const workerIndex = testInfo.workerIndex;
      const fileName = `${role}-w${workerIndex}.json`;
      const outPath = path.resolve(__dirname, "./auth", fileName);
      
      console.log(`🔐 Setting up auth state for role: ${role}, worker: ${workerIndex}`);
      
      try {
        await fs.access(outPath);
        console.log(`✅ Auth state already exists: ${outPath}`);
      } catch {
        console.log(`🔄 Generating new auth state: ${outPath}`);
        // Generate storage state with CSRF (isApi=false)
        await storeStorageState(role, false, outPath);
      }
      
      await use(outPath);
    },
    { scope: "worker" },
  ],

  // Fixed JSON directory - same for all workers
  jsonDir: [
    async ({}, use) => {
      console.log(`📁 Using shared JSON directory: ${SHARED_JSON_DIR}`);
      
      // Verify directory exists (should be created in global setup)
      try {
        await fs.access(SHARED_JSON_DIR);
        console.log("✅ JSON directory exists");
      } catch {
        console.error("❌ JSON directory missing - was global setup run?");
        throw new Error("JSON directory not found. Ensure global setup has run.");
      }
      
      await use(SHARED_JSON_DIR);
    },
    { scope: "worker" },
  ],

  // Override built-in storageState to use our worker-scoped authState
  storageState: async ({ authState }, use) => {
    await use(authState);
  },

  // Test-case ID extraction
  testCaseIDs: [
    async ({ jsonDir }, use, testInfo) => {
      const testCaseIDs = extractTestCaseIDs(testInfo.title);
      
      console.log(`🎯 Test: ${testInfo.title}`);
      console.log(`🎯 Worker: ${testInfo.workerIndex}`);
      console.log(`🎯 Test Case IDs: ${JSON.stringify(testCaseIDs)}`);
      console.log(`🎯 JSON Directory: ${jsonDir}`);
      
      // Verify all test case JSON files exist (should be created in global setup)
      if (testCaseIDs && testCaseIDs.length > 0) {
        console.log("🔍 Verifying JSON files exist...");
        
        for (const tc of testCaseIDs) {
          const filePath = path.join(jsonDir, `${tc}.json`);
          await verifyJsonFile(filePath, tc);
        }
        
        console.log("✅ All JSON files verified");
      }
      
      await use(testCaseIDs);
    },
    { scope: "test" },
  ],
});

// Per-test setup: test data
test.beforeEach(async ({ testCaseIDs }, testInfo) => {
  console.warn("💡 beforeEach - Test title:", testInfo.title);
  console.warn("💡 beforeEach - Worker:", testInfo.workerIndex);
  console.warn("💡 beforeEach - Test Case IDs:", testCaseIDs);
  console.warn("💡 beforeEach - Using shared JSON dir:", SHARED_JSON_DIR);
  
  if (!testCaseIDs || testCaseIDs.length === 0) {
    console.error("❌ No test case IDs found for:", testInfo.title);
    console.warn("⚠️  Skipping test data setup - no test case IDs");
    return;
  }
  
  console.warn("STARTED FIXTURE: BEFORE EACH");
  
  try {
    // Run all test data setup
    await runTestDataSetup(testCaseIDs);
    
    console.warn("ENDED FIXTURE: BEFORE EACH");
  } catch (error) {
    console.error("❌ beforeEach setup failed:", error.message);
    console.error("❌ Stack trace:", error.stack);
    throw error;
  }
});

// Per-test teardown
test.afterEach(async ({ testCaseIDs }, testInfo) => {
  console.warn("💡 afterEach - Test title:", testInfo.title);
  console.warn("💡 afterEach - Worker:", testInfo.workerIndex);
  console.warn("💡 afterEach - Test Case IDs:", testCaseIDs);
  
  if (!testCaseIDs || testCaseIDs.length === 0) {
    console.error("❌ No test case IDs found for:", testInfo.title);
    console.warn("⚠️  Skipping test data teardown - no test case IDs");
    return;
  }
  
  console.warn("STARTED FIXTURE: AFTER EACH");
  
  try {
    await runTestDataTeardown(testCaseIDs);
    console.warn("ENDED FIXTURE: AFTER EACH");
  } catch (error) {
    console.error("❌ afterEach teardown failed:", error.message);
    console.error("❌ Stack trace:", error.stack);
    // Don't throw here to avoid masking test failures
  }
});

module.exports = { test, expect, devices };