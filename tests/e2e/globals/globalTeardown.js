import { deleteStaleTimeEntires } from "../helpers/timesheetHelper";

// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  await deleteStaleTimeEntires();
};

export default globalTeardown;
