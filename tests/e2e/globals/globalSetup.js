import { readAndCleanAllOrphanData } from "../helpers/timesheetHelper";
import { storeStorageState } from "../helpers/storageStateHelper";
import { createJSONFile } from "../utils/fileUtils";

/**
 * Global setup function that runs before test execution.
 * It initializes test data and stores authentication details for reuse in tests.
 */
const globalSetup = async () => {


  // 1. Create API auth states
  await Promise.all([
    storeStorageState("employee", true),
    storeStorageState("employee2", true),
    storeStorageState("employee3", true),
    storeStorageState("manager", true),
    storeStorageState("admin", true),
  ]);

  // 1.1 Clean up Orphan Data
  await readAndCleanAllOrphanData();

  // 3. Create frontend UI storage states ONLY after all above is done
  await Promise.all([
    storeStorageState("employee3", false),
    storeStorageState("employee2", false),
    storeStorageState("employee", false),
    storeStorageState("manager", false),
  ]);
};

export default globalSetup;
