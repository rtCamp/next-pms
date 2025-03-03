import { LoginPage } from "../pages/loginPage";
import { TimesheetPage } from "../pages/timesheetPage";

/**
 * Logs into the ERP with provided credentials. (UI)
 * */
export const loginERP = async (page, email, password) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(email, password);
};

/**
 * Logs into the NextPMS with provided credentials. (UI)
 * */
export const loginNextPMS = async (page, email, password) => {
  const timesheetPage = new TimesheetPage(page);
  const loginPage = new LoginPage(page);

  await timesheetPage.goto();
  await loginPage.login(email, password);
};
