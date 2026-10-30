const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { SettingsPage } from "../../pageObjects/settingsPage";
import { getDocument } from "../../utils/api/apiClient";

const USER_CONFIGURATION = "User Configuration";

test.describe("Employee: Settings", () => {
  /** @type {SettingsPage} */ let settings;

  test.beforeEach(async ({ page }) => {
    settings = new SettingsPage(page);
    await settings.goto();
  });

  test("TC379: Settings opens from the Next PMS menu on the Profile tab, with User Configuration listing Profile and Timesheets", async ({
    page,
  }) => {
    allure.story("Settings");
    await settings.open();

    await expect(settings.dialog).toBeVisible();
    await expect(settings.label(USER_CONFIGURATION)).toBeVisible();
    const tabs = settings.section(USER_CONFIGURATION).getByRole("button");
    await expect(tabs).toHaveText(["Profile", "Timesheets"]);
    await expect(settings.tab(USER_CONFIGURATION, "Profile")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      settings.dialog.getByRole("heading", { level: 2, name: "Profile" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/next-pms\/timesheet/);
  });

  test("TC380: Without System Manager or Delivery Manager the dialog has only User Configuration", async ({
    browser,
  }) => {
    allure.story("Settings");
    const only = async (page) => {
      const own = new SettingsPage(page);
      await own.open();
      await expect(own.label(USER_CONFIGURATION)).toBeVisible();
      await expect(own.label("System Configuration")).toHaveCount(0);
      await expect(own.dialog.getByRole("navigation")).toHaveCount(1);
      await expect(
        own.section(USER_CONFIGURATION).getByRole("button"),
      ).toHaveText(["Profile", "Timesheets"]);
    };

    await only(settings.page);

    // The manager has Projects Manager and Timesheet Manager, which are not system roles.
    const context = await browser.newContext({
      baseURL: process.env.BASE_URL,
      storageState: path.resolve(__dirname, "../../auth/manager.json"),
    });
    try {
      const page = await context.newPage();
      await new SettingsPage(page).goto();
      await only(page);
    } finally {
      await context.close();
    }
  });

  test("TC381: Profile shows the signed-in user's name and email", async () => {
    allure.story("Settings");
    const { employee_name } = await getDocument("Employee", process.env.EMP_ID);
    await settings.open();

    await expect(
      settings.dialog.getByText("Manage your profile and login information."),
    ).toBeVisible();
    await expect(
      settings.dialog.getByText(employee_name, { exact: true }),
    ).toBeVisible();
    await expect(
      settings.dialog.getByText(process.env.EMP_EMAIL, { exact: true }),
    ).toBeVisible();
    await expect(
      settings.dialog.getByRole("button", { name: "Change Password" }),
    ).toBeVisible();
  });
});
