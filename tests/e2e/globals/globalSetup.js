import { createInitialTimeEntries } from "../helpers/timesheetHelper";
import { storeStorageState } from "../helpers/storageStateHelper";
import { updateInitialLeaveEntries } from "../helpers/leaveHelper";

// ------------------------------------------------------------------------------------------

/**
 * Global setup function that runs before test execution.
 * It initializes test data and stores authentication details for reuse in tests.
 */
const globalSetup = async () => {
  // Create initial time entries required for tests
  await createInitialTimeEntries();

  // Update dynamic fields of initial leave entries
  await updateInitialLeaveEntries();

  // Perform login and store authentication state for later use
  await storeStorageState("employee");
  await storeStorageState("manager");
};

export default globalSetup;
