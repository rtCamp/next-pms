import { deleteStaleTimeEntries } from "../helpers/timesheetHelper";
import { rejectStaleLeaveEntries } from "../helpers/leaveHelper";

// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  // Delete stale time entries
  await deleteStaleTimeEntries();

  // Reject stale leave entries
  await rejectStaleLeaveEntries();
};

export default globalTeardown;
