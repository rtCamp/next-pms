import {
  createTimeEntries,
  updateTimeEntries,
  createProjectForTestCases,
  createTaskForTestCases,
  calculateHourlyBilling,
  readAndCleanAllOrphanData,
} from "../helpers/timesheetHelper";
import { storeStorageState } from "../helpers/storageStateHelper";
import { updateLeaveEntries } from "../helpers/leaveHelper";
import { createJSONFile } from "../utils/fileUtils";
import { createEmployees } from "../helpers/employeeHelper";
import { randomApprovalStatus } from "../helpers/teamTabHelper";
import { getRandomValue } from "../utils/stringUtils";
// ------------------------------------------------------------------------------------------

/**
 * Global setup function that runs before test execution.
 * It initializes test data and stores authentication details for reuse in tests.
 */
const globalSetup = async () => {
  // Create shared JSON files
  await createJSONFile("../data/employee/shared-timesheet.json");
  await createJSONFile("../data/manager/shared-team.json");
  await createJSONFile("../data/manager/shared-task.json");
  await createJSONFile("../data/manager/tasks-to-delete.json");

  // 1. Create API auth states
  await Promise.all([
    storeStorageState("employee", true),
    storeStorageState("employee2", true),
    storeStorageState("employee3", true),
    storeStorageState("manager", true),
    storeStorageState("admin", true),
  ]);
  // 1.1 Clean up Orphan Data
  await readAndCleanAllOrphanData();

  // 2. Use API roles to create data
  await createEmployees();
  await updateTimeEntries();
  await createProjectForTestCases();
  await createTaskForTestCases();
  await createTimeEntries();
  await calculateHourlyBilling();
  await updateLeaveEntries();
  await randomApprovalStatus();

  // 3. Create frontend UI storage states ONLY after all above is done
  await Promise.all([
    storeStorageState("employee3", false),
    storeStorageState("employee2", false),
    storeStorageState("employee", false),
    storeStorageState("manager", false),
  ]);
};

export default globalSetup;
