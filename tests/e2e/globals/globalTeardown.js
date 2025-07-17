import { deleteByTaskName, readAndCleanAllOrphanData } from "../helpers/timesheetHelper";
// ------------------------------------------------------------------------------------------

/**
 * Global teardown function to delete the stale test data after running tests.
 */
const globalTeardown = async () => {
  //Delete the employees
  //await deleteEmployees();
  //Delete Stale Tasks created through UI

  //Clean up Data
  await deleteByTaskName();
  await readAndCleanAllOrphanData();
};

export default globalTeardown;
