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

// add a quick verify‑load log
console.log("🔥 loaded playwright.fixture.cjs");

// Helper to ensure a stub file exists at the given path with retries
async function ensureJsonStub(tc, filePath, maxRetries = 10) {
  console.log(`🔍 Attempting to create: ${filePath}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // First create the directory if it doesn't exist
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Then create the JSON file
      await createJSONFilePerTC(filePath);
      
      // Verify the file was created and is readable
      await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
      
      // Double check by trying to read it
      const content = await fs.readFile(filePath, 'utf-8');
      JSON.parse(content); // Verify it's valid JSON
      
      console.log(`✅ Verified JSON stub for ${tc} at ${filePath} (attempt ${attempt})`);
      return;
    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${filePath}: ${err.message}`);
      
      if (attempt === maxRetries) {
        console.error(`❌ File creation failed after ${maxRetries} attempts: ${filePath}`);
        console.error(`❌ Error: ${err.message}`);
        throw new Error(`Cannot create JSON stub for ${tc} after ${maxRetries} attempts: ${err.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
}

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

// Helper to wait for file to be created and readable with retries
async function waitForFile(filePath, maxRetries = 15, delayMs = 200) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check if file exists and is readable
      await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
      
      // Try to read the file to ensure it's not corrupted
      const content = await fs.readFile(filePath, 'utf-8');
      JSON.parse(content); // Verify it's valid JSON
      
      console.log(`✅ File confirmed exists and readable: ${filePath}`);
      return true;
    } catch (err) {
      if (i === maxRetries - 1) {
        console.error(`❌ File still doesn't exist or isn't readable after ${maxRetries} retries: ${filePath}`);
        console.error(`❌ Final error: ${err.message}`);
        throw new Error(`File not accessible after ${maxRetries} retries: ${filePath} - ${err.message}`);
      }
      console.log(`⏳ Waiting for file (attempt ${i + 1}/${maxRetries}): ${filePath}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

// Helper to run test data setup
async function runTestDataSetup(testCaseIDs, jsonDir) {
  console.log("🔧 Running test data setup for:", testCaseIDs);
  
  try {
    // ── STEP 1: run setup helpers ─────────
    await createEmployees(testCaseIDs, jsonDir);
    await updateTimeEntries(testCaseIDs, jsonDir);
    await createProjectForTestCases(testCaseIDs, jsonDir);
    await createTaskForTestCases(testCaseIDs, jsonDir);
    await createTimeEntries(testCaseIDs, jsonDir);
    await calculateHourlyBilling(testCaseIDs, jsonDir);
    await updateLeaveEntries(testCaseIDs, jsonDir);
    await randomApprovalStatus(testCaseIDs, jsonDir);
    await createUserGroupForEmployee(testCaseIDs, jsonDir);
    // ── END STEP 1 ────────────────────────
    
    console.log("✅ Test data setup completed successfully");
  } catch (error) {
    console.error("❌ Test data setup failed:", error.message);
    throw error;
  }
}

// Helper to run test data teardown
async function runTestDataTeardown(testCaseIDs, jsonDir) {
  console.log("🧹 Running test data teardown for:", testCaseIDs);
  
  try {
    await deleteEmployees(testCaseIDs, jsonDir);
    await deleteTimeEntries(testCaseIDs, jsonDir);
    await deleteTasks(testCaseIDs, jsonDir);
    await deleteProjects(testCaseIDs, jsonDir);
    await rejectLeaveEntries(testCaseIDs, jsonDir);
    await deleteUserGroupForEmployee(testCaseIDs, jsonDir);
    
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

  // Worker-scoped fixture: unique JSON‑stub directory per worker
  jsonDir: [
    async ({}, use, testInfo) => {
      const dir = path.resolve(
        __dirname,
        "data",
        `json-files-w${testInfo.workerIndex}`
      );
      
      console.log(`📁 Creating JSON directory for worker ${testInfo.workerIndex}: ${dir}`);
      await fs.mkdir(dir, { recursive: true });
      
      await use(dir);
    },
    { scope: "worker" },
  ],

  // Override built-in storageState to use our worker-scoped authState
  storageState: async ({ authState }, use) => {
    await use(authState);
  },

  // Enhanced test-case ID extraction that also handles setup
  testCaseIDs: [
    async ({ jsonDir }, use, testInfo) => {
      const testCaseIDs = extractTestCaseIDs(testInfo.title);
      
      console.log(`🎯 Test: ${testInfo.title}`);
      console.log(`🎯 Worker: ${testInfo.workerIndex}`);
      console.log(`🎯 Test Case IDs: ${JSON.stringify(testCaseIDs)}`);
      console.log(`🎯 JSON Directory: ${jsonDir}`);
      
      // If we have test case IDs, ensure the files exist immediately
      if (testCaseIDs && testCaseIDs.length > 0) {
        console.log("🔧 Pre-creating JSON files for test case IDs...");
        
        // Create files sequentially to avoid race conditions
        for (const tc of testCaseIDs) {
          const filePath = path.join(jsonDir, `${tc}.json`);
          await ensureJsonStub(tc, filePath);
          // Wait for file to be confirmed as created and readable
          await waitForFile(filePath);
        }
        
        // Populate the JSON stubs with test data
        console.log("🔧 Populating JSON stubs...");
        await populateJsonStubs(jsonDir, testCaseIDs);
        
        // Final verification that files exist and are readable after population
        for (const tc of testCaseIDs) {
          const filePath = path.join(jsonDir, `${tc}.json`);
          await waitForFile(filePath);
        }
        
        console.log("✅ All JSON files created and populated successfully");
      }
      
      await use(testCaseIDs);
    },
    { scope: "test" },
  ],
});

// Per-test setup: JSON stubs and test data
test.beforeEach(async ({ testCaseIDs, jsonDir }, testInfo) => {
  console.warn("💡 beforeEach - Test title:", testInfo.title);
  console.warn("💡 beforeEach - Worker:", testInfo.workerIndex);
  console.warn("💡 beforeEach - Test Case IDs:", testCaseIDs);
  console.warn("💡 beforeEach - JsonDir:", jsonDir);
  
  if (!testCaseIDs || testCaseIDs.length === 0) {
    console.error("❌ No test case IDs found for:", testInfo.title);
    console.warn("⚠️  Skipping test data setup - no test case IDs");
    return;
  }
  
  console.warn("STARTED FIXTURE: BEFORE EACH");
  
  try {
    // Files should already exist from testCaseIDs fixture, but verify they're accessible
    for (const tc of testCaseIDs) {
      const filePath = path.join(jsonDir, `${tc}.json`);
      try {
        await waitForFile(filePath, 5); // Quick check with fewer retries
        console.log(`✅ Confirmed file exists: ${filePath}`);
      } catch (err) {
        console.error(`❌ File missing in beforeEach: ${filePath}`);
        console.error(`❌ Error: ${err.message}`);
        // Try to recreate it
        await ensureJsonStub(tc, filePath);
        await populateJsonStubs(jsonDir, [tc]);
        await waitForFile(filePath);
        console.log(`✅ Recreated file: ${filePath}`);
      }
    }
    
    // Run all test data setup
    await runTestDataSetup(testCaseIDs, jsonDir);
    
    console.warn("ENDED FIXTURE: BEFORE EACH");
  } catch (error) {
    console.error("❌ beforeEach setup failed:", error.message);
    console.error("❌ Stack trace:", error.stack);
    throw error;
  }
});

// Per-test teardown
test.afterEach(async ({ testCaseIDs, jsonDir }, testInfo) => {
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
    await runTestDataTeardown(testCaseIDs, jsonDir);
    console.warn("ENDED FIXTURE: AFTER EACH");
  } catch (error) {
    console.error("❌ afterEach teardown failed:", error.message);
    console.error("❌ Stack trace:", error.stack);
    // Don't throw here to avoid masking test failures
  }
});

module.exports = { test, expect, devices };