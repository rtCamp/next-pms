import { createInitialTimeEntires } from "../helpers/timesheetHelper";

/**
 * Global setup function to initialize required test data before running tests.
 */
const globalSetup = async () => {
  await createInitialTimeEntires();
};

export default globalSetup;
