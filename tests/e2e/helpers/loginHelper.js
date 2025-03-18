import { LoginPage } from "../pageObjects/loginPage";
import { TimesheetPage } from "../pageObjects/timesheetPage";

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
