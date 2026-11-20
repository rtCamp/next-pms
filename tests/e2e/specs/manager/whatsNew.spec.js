const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { signedInContext } from "../../helpers/storageStateHelper";
import { NavigationPage } from "../../pageObjects/navigationPage";
import { WhatsNewPage } from "../../pageObjects/whatsNewPage";
import {
  createDocument,
  getDocList,
  updateDocument,
} from "../../utils/api/apiClient";
import { apiRequest } from "../../utils/api/timesheetRequests";
import { readJSONFile } from "../../utils/fileUtils";

// TC411 (data/manager/access.js) seeds a user of its own; each case first sets the last
// release that user saw, so the cases run in order.
const FIXTURE = "TC411";
const SETTING = "PMS User Setting";
const UNSEEN = "What's new, new release";
const SEEN = "What's new";

test.describe.configure({ mode: "serial" });

/** "2.14.0" > "2.9.0": compares versions part by part, newest first. */
const newestFirst = (a, b) => {
  const [x, y] = [a, b].map((v) => v.replace(/^v/, "").split(".").map(Number));
  return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
};

test.describe("Global & Navigation: What's new", () => {
  let user;
  let notes;

  test.beforeAll(async ({ jsonDir }) => {
    const data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[
      FIXTURE
    ];
    user = data.employees.WnReader.user;
    // The cached release notes the page shows; the same for every user.
    notes = (
      await apiRequest(
        "/api/method/next_pms.api.whats_new.get_release_notes",
        { method: "GET" },
        "admin",
      )
    ).message;
  });

  const lastSeen = async () =>
    (
      await getDocList(SETTING, [["name", "=", user.email]], {
        fields: ["whats_new_last_seen"],
      })
    )[0]?.whats_new_last_seen || null;

  /** Sets the newest release the user has seen; the app creates the document on first use. */
  const setLastSeen = async (version) => {
    const [existing] = await getDocList(SETTING, [["name", "=", user.email]]);
    if (existing) {
      await updateDocument(SETTING, user.email, {
        whats_new_last_seen: version,
      });
    } else {
      await createDocument(SETTING, {
        user: user.email,
        whats_new_last_seen: version,
      });
    }
  };

  /** Runs `body` signed in as the seeded user, on the Personal timesheet. */
  const signedIn = async (browser, body) => {
    const context = await signedInContext(browser, user, "whats-new");
    try {
      const page = await context.newPage();
      const nav = new NavigationPage(page);
      await nav.goto("/timesheet");
      await body({ page, nav });
    } finally {
      await context.close();
    }
  };

  test("TC411: An unseen release shows a dot on the logo and the menu item, the page lists the installed releases newest first, and opening it clears the dots for good", async ({
    browser,
  }) => {
    allure.story("Global & Navigation");
    expect(notes.releases.length, "release notes are cached").toBeGreaterThan(
      0,
    );
    const latest = notes.releases[0].version;
    await setLastSeen(null);

    await signedIn(browser, async ({ page, nav }) => {
      await expect(nav.newReleaseDot).toHaveCount(1);
      await nav.chooseFromMenu(UNSEEN);
      await expect(page).toHaveURL(/\/next-pms\/whats-new$/);

      const whatsNew = new WhatsNewPage(page);
      await expect(whatsNew.heading).toBeVisible();
      await expect(whatsNew.installedVersion).toHaveText(
        `You're on v${notes.current_version}`,
      );
      await expect(whatsNew.releases).toHaveCount(notes.releases.length);
      const shown = await whatsNew.versions();
      expect(shown).toEqual(notes.releases.map(({ version }) => `v${version}`));
      expect(shown).toEqual([...shown].sort(newestFirst));
      await expect(whatsNew.latestBadge(latest)).toBeVisible();
      await expect(whatsNew.notes(latest)).toBeVisible();

      // Seeing the page records the latest release and takes the dot away.
      await expect(nav.newReleaseDot).toHaveCount(0);
      await expect.poll(lastSeen).toBe(latest);

      await page.reload();
      await nav.headerMenu.waitFor();
      await expect(nav.newReleaseDot).toHaveCount(0);
      await nav.headerMenu.click();
      await expect(nav.menuItem(SEEN)).toBeVisible();
    });
  });

  test("TC412: Global search opens What's new; older releases start closed and open and close from their header, the latest has no toggle", async ({
    browser,
  }) => {
    allure.story("Global & Navigation");
    expect(notes.releases.length, "two releases are cached").toBeGreaterThan(1);
    const [latest, older] = notes.releases.map(({ version }) => version);

    await signedIn(browser, async ({ page, nav }) => {
      await nav.openSearch();
      await nav.searchFor(SEEN);
      await nav.searchResults.filter({ hasText: /^What's new$/ }).click();
      await expect(page).toHaveURL(/\/next-pms\/whats-new$/);

      const whatsNew = new WhatsNewPage(page);
      await expect(whatsNew.notes(latest)).toBeVisible();
      await expect(whatsNew.toggle(latest)).toHaveCount(0);

      const toggle = whatsNew.toggle(older);
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(whatsNew.notes(older)).toHaveCount(0);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(whatsNew.notes(older)).toBeVisible();
      await toggle.click();
      await expect(whatsNew.notes(older)).toHaveCount(0);
    });
  });

  test("TC413: The dot follows the last release the user saw: none once the latest is seen, back when only an older one is", async ({
    browser,
  }) => {
    allure.story("Global & Navigation");
    expect(notes.releases.length, "two releases are cached").toBeGreaterThan(1);
    const [latest, older] = notes.releases.map(({ version }) => version);
    await setLastSeen(latest);

    await signedIn(browser, async ({ page, nav }) => {
      await expect(nav.newReleaseDot).toHaveCount(0);
      await nav.headerMenu.click();
      await expect(nav.menuItem(SEEN)).toBeVisible();
      await page.keyboard.press("Escape");

      await setLastSeen(older);
      await page.reload();
      await nav.headerMenu.waitFor();
      await expect(nav.newReleaseDot).toHaveCount(1);
      await nav.headerMenu.click();
      await expect(nav.menuItem(UNSEEN)).toBeVisible();
    });
  });
});
