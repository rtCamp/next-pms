import { deleteByTaskName, readAndCleanAllOrphanData } from "../helpers/timesheetHelper";
import { deleteEmployees } from "../helpers/employeeHelper";
// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  //Delete the employees
  await deleteEmployees();
  //Delete Stale Tasks created through UI
  await deleteByTaskName();
  //Clean up Data
  await readAndCleanAllOrphanData();
};

export default globalTeardown;
