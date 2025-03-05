import { createInitialTimeEntires } from "../helpers/timesheetHelper";
import { storeStorageState } from "../helpers/storageStateHelper";

// ------------------------------------------------------------------------------------------

/**
 * Global setup function that runs before test execution.
 * It initializes test data and stores authentication details for reuse in tests.
 */
const globalSetup = async () => {
  // Create initial time entries required for tests
  await createInitialTimeEntires();

  // Perform login and store authentication state for later use
  await storeStorageState();
};

export default globalSetup;
