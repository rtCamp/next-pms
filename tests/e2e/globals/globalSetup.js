import { readAndCleanAllOrphanData } from "../helpers/timesheetHelper";
import { storeStorageState } from "../helpers/storageStateHelper";
import { createJSONFile, populateJsonStubs } from "../utils/fileUtils";
import path from "path";
import fs from "fs";

// Import data modules to get all test case IDs
import employeeTimesheetData from "../data/employee/timesheet";
import managerTeamData from "../data/manager/team";
import managerTaskData from "../data/manager/task";

/**
 * Global setup function that runs before test execution.
 * It initializes test data and stores authentication details for reuse in tests.
 */
const globalSetup = async () => {
  console.log("🚀 Starting global setup...");
  
  // 1) Pre‑generate API auth states for all roles
  const roles = ["employee", "employee2", "employee3", "manager", "admin"];
  await Promise.all(
    roles.map(role =>
      // `true` ⇒ API‑only state, saved to `auth/<role>-API.json`
      storeStorageState(role, true)
    )
  );

  // 2) Create JSON files for all test cases
  console.log("📁 Creating JSON files for all test cases...");
  
  // Define the single JSON directory
  const jsonDir = path.resolve(__dirname, "../data/json-files");
  
  // Ensure directory exists
  await fs.promises.mkdir(jsonDir, { recursive: true });
  
  // Collect all unique test case IDs from all data sources
  const allTestCaseIDs = new Set();
  
  // Add all test case IDs from each data source
  Object.keys(employeeTimesheetData).forEach(id => allTestCaseIDs.add(id));
  Object.keys(managerTeamData).forEach(id => allTestCaseIDs.add(id));
  Object.keys(managerTaskData).forEach(id => allTestCaseIDs.add(id));
  
  console.log(`📋 Found ${allTestCaseIDs.size} unique test cases:`, Array.from(allTestCaseIDs).sort());
  
  // Create JSON file for each test case
  for (const tcId of allTestCaseIDs) {
    const filePath = path.join(jsonDir, `${tcId}.json`);
    
    try {
      // Create the JSON file with empty object
      await createJSONFile(filePath, { [tcId]: {} });
      console.log(`✅ Created JSON file: ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed to create JSON file for ${tcId}:`, err.message);
      throw err;
    }
  }
  
  // 3) Populate all JSON stubs with data
  console.log("📝 Populating JSON stubs with test data...");
  await populateJsonStubs(jsonDir, Array.from(allTestCaseIDs));
  
  // 4) Verify all files are created and readable
  console.log("🔍 Verifying all JSON files...");
  for (const tcId of allTestCaseIDs) {
    const filePath = path.join(jsonDir, `${tcId}.json`);
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      if (!data[tcId]) {
        throw new Error(`JSON file missing data for key "${tcId}"`);
      }
      console.log(`✅ Verified: ${tcId}.json`);
    } catch (err) {
      console.error(`❌ Verification failed for ${tcId}.json:`, err.message);
      throw err;
    }
  }
  
  console.log("✅ All JSON files created and populated successfully!");
  
  // 5) Clean up any orphan data
  await readAndCleanAllOrphanData();
  
  console.log("✅ Global setup completed successfully!");
};

export default globalSetup;