import { readAndCleanAllOrphanData } from "../helpers/timesheetHelper";
import { storeStorageState } from "../helpers/storageStateHelper";
import { createJSONFile } from "../utils/fileUtils";

/**
 * Global setup function that runs before test execution.
 * It initializes test data and stores authentication details for reuse in tests.
 */
const globalSetup = async () => {
  // 1) Pre‑generate API auth states for all roles
  const roles = ["employee", "employee2", "employee3", "manager", "admin"];
  await Promise.all(
    roles.map(role =>
      // `true` ⇒ API‑only state, saved to `auth/<role>-API.json`
      storeStorageState(role, true)
    )
  );

  // 2) Now that API auth is in place, clean up any orphan data
  await readAndCleanAllOrphanData();


};

export default globalSetup;
