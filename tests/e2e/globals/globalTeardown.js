import { deleteTimeEntries, deleteProjects, deleteTasks, deleteByTaskName } from "../helpers/timesheetHelper";
import { rejectLeaveEntries } from "../helpers/leaveHelper";
import { deleteEmployees } from "../helpers/employeeHelper";

// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  //Delete the employees
  await deleteEmployees();

  // Delete stale time entries
  await deleteTimeEntries();

  // Delete Stale Tasks
  await deleteTasks();

  //Delete Stale Tasks created through UI
  await deleteByTaskName();

  // Delete Stale Projects
  await deleteProjects();

  // Reject stale leave entries
  await rejectLeaveEntries();
};

export default globalTeardown;
