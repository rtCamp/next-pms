import { LoginPage } from "../pages/loginPage";
import { TimesheetPage } from "../pages/timesheetPage";

// ------------------------------------------------------------------------------------------

/**
 * Logs into the NextPMS with provided credentials. (UI)
 * */
export const loginNextPMS = async (page, email, password) => {
  const timesheetPage = new TimesheetPage(page);
  const loginPage = new LoginPage(page);

  await timesheetPage.goto();
  await loginPage.login(email, password);
};
