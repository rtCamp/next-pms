import { createTimeEntries, updateTimeEntries, createProjects, createTasks } from "../helpers/timesheetHelper";
import { storeStorageState } from "../helpers/storageStateHelper";
import { updateLeaveEntries } from "../helpers/leaveHelper";
import { createJSONFile } from "../utils/fileUtils";

// ------------------------------------------------------------------------------------------

/**
 * Global setup function that runs before test execution.
 * It initializes test data and stores authentication details for reuse in tests.
 */
const globalSetup = async () => {
  // Create shared JSON files
  await createJSONFile("../data/employee/shared-timesheet.json");
  await createJSONFile("../data/manager/shared-team.json");

  // Compute and update dynamic fields of time entries
  await updateTimeEntries();

  // Create projects
  await createProjects();

  // Create tasks
  await createTasks();
  // Create initial time entries
  await createTimeEntries();

  // Compute and update dynamic fields of leave entries
  await updateLeaveEntries();

  // Perform login and store authentication state for later use
  await storeStorageState("employee");
  await storeStorageState("manager");
};

export default globalSetup;
