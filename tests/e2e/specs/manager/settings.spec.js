const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import fs from "fs";
import path from "path";
import { storeStorageState } from "../../helpers/storageStateHelper";
import { SettingsPage } from "../../pageObjects/settingsPage";
import { TimesheetWeeksPage } from "../../pageObjects/timesheetWeeksPage";
import { createDocument, getDocList, getDocument, updateDocument } from "../../utils/api/apiClient";
import { readJSONFile } from "../../utils/fileUtils";

// TC382 (data/manager/settings.js) seeds an employee with System Manager to sign in as, so
// the shared accounts keep their own settings. The system cases change the one Timesheet
// Settings document every test reads, so they run in order and put back what they change.
test.describe.configure({ mode: "serial" });

const FIXTURE = "TC382";
const AUTH = path.resolve(__dirname, "../../auth/settings-admin.json");
const USER = "User Configuration";
const SYSTEM = "System Configuration";
const SYSTEM_DOC = "Timesheet Settings";
const SAVED = "Settings saved";
const TOO_MANY = /Auto Expand Weeks by Default cannot exceed 12/;
const APP_DEFAULT_WEEKS = 4;

const systemDoc = () => getDocument(SYSTEM_DOC, SYSTEM_DOC);
const setSystem = (values) => updateDocument(SYSTEM_DOC, SYSTEM_DOC, values);
const systemWeeks = async () => (await systemDoc()).auto_expand_weeks_by_default || APP_DEFAULT_WEEKS;
/** A personal number of weeks that differs from the system's. */
const otherWeeks = (system) => (system === 2 ? 3 : 2);

const personalDoc = (email) => getDocument("PMS User Setting", email);
/** The user's personal settings as a case needs them; the app creates the document on first use. */
const setPersonal = async (email, values) => {
  const [existing] = await getDocList("PMS User Setting", [["name", "=", email]]);
  if (existing) await updateDocument("PMS User Setting", email, values);
  else await createDocument("PMS User Setting", { user: email, ...values });
};

test.describe("Settings: personal and system configuration", () => {
  let data;
  let email;
  /** @type {import('@playwright/test').BrowserContext} */ let context;
  /** @type {import('@playwright/test').Page} */ let page;
  /** @type {SettingsPage} */ let settings;

  test.beforeAll(async ({ jsonDir }) => {
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
    const { user } = data.employees.SetAdmin;
    email = user.email;
    await storeStorageState(user, false, AUTH);
  });

  test.afterAll(async () => {
    await fs.promises.rm(AUTH, { force: true });
  });

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      baseURL: process.env.BASE_URL,
      storageState: AUTH,
    });
    page = await context.newPage();
    settings = new SettingsPage(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  /** Opens the dialog on a tab, loading the page first. */
  const openOn = async (section, tab) => {
    await settings.goto();
    await settings.open();
    await settings.openTab(section, tab);
  };

  test("TC382: The Timesheets tab starts on the system default, then enables the user's own number", async () => {
    allure.story("Settings");
    const system = await systemWeeks();
    const own = otherWeeks(system);
    await setPersonal(email, {
      use_system_auto_expand_weeks: 1,
      auto_expand_weeks_by_default: own,
    });

    await openOn(USER, "Timesheets");
    await expect(settings.useSystemDefault).toBeChecked();
    await expect(settings.weeksInput).toBeDisabled();
    await expect(settings.weeksInput).toHaveValue(String(system));

    await settings.useSystemDefault.uncheck();
    await expect(settings.weeksInput).toBeEnabled();
    await expect(settings.weeksInput).toHaveValue(String(own));
  });

  test("TC383: A personal Default Expanded Weeks value is saved and is still there after a reload", async () => {
    allure.story("Settings");
    const system = await systemWeeks();
    const own = otherWeeks(system);
    await setPersonal(email, {
      use_system_auto_expand_weeks: 1,
      auto_expand_weeks_by_default: 0,
    });

    await openOn(USER, "Timesheets");
    await settings.useSystemDefault.uncheck();
    await settings.weeksInput.fill(String(own));
    await settings.save();
    await expect(settings.toast(SAVED)).toBeVisible();

    const saved = await personalDoc(email);
    expect(saved.auto_expand_weeks_by_default).toBe(own);
    expect(saved.use_system_auto_expand_weeks).toBe(0);

    await page.reload();
    await settings.open();
    await settings.openTab(USER, "Timesheets");
    await expect(settings.useSystemDefault).not.toBeChecked();
    await expect(settings.weeksInput).toBeEnabled();
    await expect(settings.weeksInput).toHaveValue(String(own));
  });

  test("TC384: The Personal timesheet expands the personal number of weeks, and the system number once Use system default is ticked", async () => {
    allure.story("Settings");
    const system = await systemWeeks();
    const own = otherWeeks(system);
    await setPersonal(email, {
      use_system_auto_expand_weeks: 0,
      auto_expand_weeks_by_default: own,
    });

    const weeks = new TimesheetWeeksPage(page);
    const expanded = () => weeks.weekHeaders.and(page.locator('[aria-expanded="true"]')).count();
    await weeks.goto();
    await expect.poll(expanded).toBe(own);

    await settings.open();
    await settings.openTab(USER, "Timesheets");
    await settings.useSystemDefault.check();
    await settings.save();
    await expect(settings.toast(SAVED)).toBeVisible();

    await weeks.goto();
    const loaded = await weeks.weekHeaders.count();
    await expect.poll(expanded).toBe(Math.min(system, loaded));
  });

  test("TC385: System Timesheets shows its two sections, and each tick reveals its own fields", async () => {
    allure.story("Settings");
    await openOn(SYSTEM, "Timesheets");
    await expect(settings.label("Time Entry Rules")).toBeVisible();
    await expect(settings.label("Reminder Settings")).toBeVisible();

    // Always there, whatever is ticked.
    for (const text of [
      "Timesheet Approval Template",
      "Timesheet Rejection Template",
      "Auto Expand Weeks by Default",
    ]) {
      await expect(settings.label(text)).toBeVisible();
    }
    for (const text of ["Allow Future Entries", "Allow Weekend Entries"]) {
      await expect(settings.checkbox(text)).toBeVisible();
    }

    /** Ticking `box` shows `fields`; unticking it hides them. Nothing is saved. */
    const reveals = async (box, fields) => {
      await settings.checkbox(box).setChecked(false);
      for (const field of fields) {
        await expect(settings.label(field), `${field} hidden`).toHaveCount(0);
      }
      await settings.checkbox(box).setChecked(true);
      for (const field of fields) {
        await expect(settings.label(field), `${field} shown`).toBeVisible();
      }
    };

    await reveals("Allow Backdated Entries", [
      "Allow backdated time entry for days limit - Employee",
      "Allow backdated time entry for days limit - Manager",
      "Backdated Entry Limit - Exempted Roles",
    ]);
    await reveals("Send Reminder On Approval Request", ["Approval Request Reminder Template"]);

    // Allowed Departments serves both the daily and the weekly reminder.
    await settings.checkbox("Send Daily Reminder").setChecked(false);
    await settings.checkbox("Send Weekly Approval Reminder").setChecked(false);
    await expect(settings.label("Allowed Departments")).toHaveCount(0);
    await reveals("Send Daily Reminder", ["Daily Reminder Template", "Allowed Departments"]);
    await settings.checkbox("Send Daily Reminder").setChecked(false);
    await reveals("Send Weekly Approval Reminder", [
      "Day To Send Weekly Reminder",
      "Weekly Approval Reminder Template",
      "Allowed Departments",
    ]);
  });

  test("TC386: A changed system timesheet option is saved, is still there after a reload and is stored on Timesheet Settings", async () => {
    allure.story("Settings");
    const original = (await systemDoc()).auto_expand_weeks_by_default;
    const changed = original === 7 ? 6 : 7;
    try {
      await openOn(SYSTEM, "Timesheets");
      await settings.numberField("Auto Expand Weeks by Default").fill(String(changed));
      await settings.save();
      await expect(settings.toast(SAVED)).toBeVisible();
      expect((await systemDoc()).auto_expand_weeks_by_default).toBe(changed);

      await page.reload();
      await settings.open();
      await settings.openTab(SYSTEM, "Timesheets");
      await expect(settings.numberField("Auto Expand Weeks by Default")).toHaveValue(String(changed));
    } finally {
      await setSystem({ auto_expand_weeks_by_default: original ?? 0 });
    }
  });

  test("TC387: A system Auto Expand Weeks above 12 is refused and the saved value is unchanged", async () => {
    allure.story("Settings");
    const original = (await systemDoc()).auto_expand_weeks_by_default;
    try {
      await openOn(SYSTEM, "Timesheets");
      await settings.numberField("Auto Expand Weeks by Default").fill("13");
      await settings.save();
      await expect(settings.toast(TOO_MANY)).toBeVisible();
      expect((await systemDoc()).auto_expand_weeks_by_default).toBe(original);
    } finally {
      await setSystem({ auto_expand_weeks_by_default: original ?? 0 });
    }
  });
});
