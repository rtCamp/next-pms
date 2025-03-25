import { deleteTimeEntries,deleteProjects, deleteTasks } from "../helpers/timesheetHelper";
import { rejectLeaveEntries } from "../helpers/leaveHelper";

// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  // Delete stale time entries
  await deleteTimeEntries();

    // Delete Stale Projects
    await deleteTasks();

  // Delete Stale Projects
  await deleteProjects();

  // Reject stale leave entries
  await rejectLeaveEntries();
};

export default globalTeardown;
