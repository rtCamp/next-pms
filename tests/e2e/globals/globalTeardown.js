import { readAndCleanAllOrphanData } from "../helpers/timesheetHelper";
import { rejectLeaveEntries } from "../helpers/leaveHelper";
import { deleteEmployees } from "../helpers/employeeHelper";

// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  //Clean up Data
  await readAndCleanAllOrphanData();
};

export default globalTeardown;
