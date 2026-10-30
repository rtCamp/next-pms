const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { signedInContext } from "../../helpers/storageStateHelper";
import { NavigationPage } from "../../pageObjects/navigationPage";
import { getDocument, updateDocument } from "../../utils/api/apiClient";
import { readJSONFile } from "../../utils/fileUtils";

// TC388 (data/manager/access.js) seeds three unread notifications for the Projects Manager
// login user, who is the one these cases open the tray as. Every case brings them back to
// unread first, because the ones before it may have read them.
const FIXTURE = "TC388";
const NOTIFICATION = "NextPMS Notifications";
const KEYS = ["notification1", "notification2", "notification3"];

test.describe.configure({ mode: "serial" });

test.describe("Global & Navigation: notifications and sign-out", () => {
  let data;
  let notices;

  test.beforeAll(async ({ jsonDir }) => {
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
  });

  /** Runs `body` signed in as one of the seeded users, in a session of its own. */
  const signedInAs = async (browser, key, body) => {
    const context = await signedInContext(
      browser,
      data.employees[key].user,
      `access-${key}-nav`,
    );
    try {
      const page = await context.newPage();
      await body({ page, nav: new NavigationPage(page) });
    } finally {
      await context.close();
    }
  };

  const unread = async () => {
    notices = [];
    for (const key of KEYS) {
      const name = data.docs[key];
      await updateDocument(NOTIFICATION, name, { viewed: 0 });
      notices.push(await getDocument(NOTIFICATION, name));
    }
  };

  test("TC402: The notifications tray lists the unread notifications with their text and when they arrived", async ({
    browser,
  }) => {
    allure.story("Global & Navigation");
    await unread();
    await signedInAs(browser, "AcProjMgr", async ({ nav }) => {
      await nav.goto("/timesheet");
      await nav.openTray();
      await expect(
        nav.tray.getByText("Notifications", { exact: true }),
      ).toBeVisible();
      for (const { title, label } of notices) {
        const item = nav.trayItem(title);
        await expect(item).toHaveCount(1);
        await expect(item).toContainText(label);
        await expect(item).toContainText(/ ago/);
      }
    });
  });

  test("TC403: Clicking a notification opens the page it links to and marks it as read", async ({
    browser,
  }) => {
    allure.story("Global & Navigation");
    await unread();
    const [clicked, other] = notices;
    await signedInAs(browser, "AcProjMgr", async ({ page, nav }) => {
      await nav.goto("/timesheet");
      await nav.openTray();
      await nav.trayItem(clicked.title).click();
      await expect(page).toHaveURL(new RegExp(`${clicked.url}$`));
      await expect
        .poll(
          async () => (await getDocument(NOTIFICATION, clicked.name)).viewed,
        )
        .toBe(1);

      await nav.openTray();
      await expect(nav.trayItem(clicked.title)).toHaveCount(0);
      await expect(nav.trayItem(other.title)).toHaveCount(1);
    });
    expect((await getDocument(NOTIFICATION, other.name)).viewed).toBe(0);
  });

  test("TC404: Mark all as read empties the tray and marks every notification as read", async ({
    browser,
  }) => {
    allure.story("Global & Navigation");
    await unread();
    await signedInAs(browser, "AcProjMgr", async ({ page, nav }) => {
      await nav.goto("/timesheet");
      await nav.openTray();
      for (const { title } of notices) {
        await expect(nav.trayItem(title)).toHaveCount(1);
      }

      await nav.markAllRead.click();
      for (const { title } of notices) {
        await expect(nav.trayItem(title)).toHaveCount(0);
      }
      for (const { name } of notices) {
        await expect
          .poll(async () => (await getDocument(NOTIFICATION, name)).viewed)
          .toBe(1);
      }

      await page.reload();
      await nav.openTray();
      // The placeholder shows until the list has loaded; the three read ones then stay hidden.
      await expect(nav.tray.getByText("No notifications yet.")).toHaveCount(0);
      await expect(nav.trayItems).toHaveCount(0);
    });
  });

  test("TC405: Logout ends the session and returns to the login page", async ({
    browser,
  }) => {
    allure.story("Global & Navigation");
    await signedInAs(browser, "AcSysMgr", async ({ page, nav }) => {
      await nav.goto("/timesheet");
      await nav.chooseFromMenu("Logout");
      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.getByRole("textbox", { name: "Password" }),
      ).toBeVisible();

      await page.goto("/next-pms/timesheet", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
