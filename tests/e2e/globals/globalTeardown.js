import { deleteTimeEntries } from "../helpers/timesheetHelper";
import { rejectLeaveEntries } from "../helpers/leaveHelper";
import { deleteTasks } from "../helpers/taskHelper";


// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  // Delete stale time entries
  await deleteTimeEntries();

  // Delete stale Task
  await deleteTasks();

  // Reject stale leave entries
  await rejectLeaveEntries();
};

export default globalTeardown;
