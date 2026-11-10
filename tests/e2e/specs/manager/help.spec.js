const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { NavigationPage } from "../../pageObjects/navigationPage";
import { ProjectRisksPage } from "../../pageObjects/projectRisksPage";
import { readJSONFile } from "../../utils/fileUtils";
import { scaleTimeout } from "../../utils/timeouts";

// TC299 seeds "E2E Prj Detail", whose tabs these cases open; see data/manager/projects.js.
const FIXTURE = "TC299";
const OPEN_RISK = "E2E Prj open risk";
const WIKI = "https://github.com/rtCamp/next-pms/wiki";

const EVERYWHERE = [
  "Jump anywhere with search",
  "Open Settings and the app menu",
];

// A tip each page lists under "On this page"; the manager holds every role these need.
const PAGE_TIPS = [
  ["/timesheet", "Add time to a task"],
  ["/timesheet/team", "Approve a week"],
  ["/timesheet/project", "Approve time on a project"],
  ["/projects", "Switch views from the page title"],
  ["/tasks", "Open a task's time log from its subject"],
  ["/allocations/team", "Add an allocation"],
  ["/allocations/project", "Allocate someone new to a project"],
  ["/dashboard/manager", "What this dashboard covers"],
];

test.describe("Manager: Help panel and help cards", () => {
  /** @type {NavigationPage} */ let nav;
  let project;

  test.beforeEach(async ({ page, jsonDir }) => {
    nav = new NavigationPage(page);
    project = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[
      FIXTURE
    ].payloadDeleteProject5.projectId;
  });

  test("TC410: The Help panel lists each page's own tips under On this page, and the tips for every page under Everywhere", async () => {
    allure.story("Global & Navigation");
    for (const [route, tip] of PAGE_TIPS) {
      await nav.goto(route);
      await nav.openHelp();
      await expect(nav.helpTips("On this page"), route).toContainText([tip]);
      await expect(nav.helpTips("Everywhere"), route).toHaveText(EVERYWHERE);
      await nav.closeHelp.click();
      await expect(nav.helpPanel).toBeHidden();
    }
  });

  test("TC411: A tip opens to its text and wiki link, and the panel closes from its close button, Escape or the Help item", async ({
    page,
  }) => {
    allure.story("Global & Navigation");
    await nav.goto("/timesheet");
    await nav.openHelp();
    await expect(nav.helpButton).toHaveAttribute("aria-expanded", "true");

    const title = EVERYWHERE[0];
    await nav.helpTip(title).click();
    const body = nav.helpTipBody(title);
    await expect(body).toContainText("Press Ctrl+K");
    await expect(
      body.getByRole("link", { name: "Learn more in the wiki" }),
    ).toHaveAttribute("href", `${WIKI}/Navigation-and-Layout#global-search`);

    // The panel isn't modal: the page stays usable while it's open.
    await nav.searchButton.click();
    await expect(nav.searchInput).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(nav.searchInput).toBeHidden();
    await expect(nav.helpPanel).toBeVisible();

    await nav.closeHelp.click();
    await expect(nav.helpPanel).toBeHidden();
    await expect(nav.helpButton).toBeFocused();

    await nav.openHelp();
    await page.keyboard.press("Escape");
    await expect(nav.helpPanel).toBeHidden();

    await nav.openHelp();
    await nav.helpButton.click();
    await expect(nav.helpPanel).toBeHidden();
    await expect(nav.helpButton).toHaveAttribute("aria-expanded", "false");
  });

  test("TC412: On a project, the Help panel lists the open tab's tips and follows a tab change", async ({
    page,
  }) => {
    allure.story("Projects");
    const risks = new ProjectRisksPage(page);
    await risks.goto(project, { tab: "risks" });
    await nav.openHelp();
    await expect(nav.helpTips("On this page")).toHaveText([
      "Change a risk's status or level with an update",
      "What the Risks tab shows",
    ]);

    await page.getByRole("tab", { name: "Growth" }).click();
    await expect(nav.helpTips("On this page")).toHaveText([
      "Change an initiative's status with an update",
      "What the Growth tab shows",
      "Add an action item to an initiative",
    ]);

    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(nav.helpTips("On this page")).toContainText([
      "What the Overview tab shows",
    ]);
  });

  test("TC413: A tip's motion plays, pauses, and opens enlarged in a dialog", async ({
    page,
  }) => {
    allure.story("Global & Navigation");
    const title = "Add time to a task";
    await nav.goto("/timesheet");
    await nav.openHelp();
    await nav.helpTip(title).click();
    const body = nav.helpTipBody(title);

    // The scene is loaded on demand; the stage is named after the tip once it has.
    const stage = body.getByRole("img", { name: title });
    await expect(stage).toBeVisible({ timeout: scaleTimeout(15000) });
    await expect(stage.locator("> *").first()).toBeAttached();
    const progress = body.getByRole("slider", { name: "Animation progress" });
    const at = async () => Number(await progress.getAttribute("aria-valuenow"));
    const start = await at();
    await expect.poll(at).not.toBe(start);

    await body.getByRole("button", { name: "Pause animation" }).click();
    await expect(
      body.getByRole("button", { name: "Play animation" }),
    ).toBeVisible();
    const paused = await at();
    await page.waitForTimeout(500);
    expect(await at()).toBe(paused);

    await body.getByRole("button", { name: "Enlarge animation" }).click();
    const enlarged = page.getByRole("dialog", { name: title });
    await expect(enlarged.getByRole("img", { name: title })).toBeVisible({
      timeout: scaleTimeout(15000),
    });
    await enlarged.getByRole("button", { name: "Shrink animation" }).click();
    await expect(enlarged).toBeHidden();
    await expect(nav.helpPanel).toBeVisible();
  });

  test("TC414: The info icons on the project tabs open their help cards, with a link to the wiki page", async ({
    page,
  }) => {
    allure.story("Projects");
    const risks = new ProjectRisksPage(page);

    /** Hovers an info icon and returns the card it opens. */
    const card = async (title) => {
      const opened = page
        .locator("[data-side]:visible")
        .filter({ hasText: title })
        .last();
      // The icon can move while the page settles, so hover it afresh until the card opens.
      await expect(async () => {
        await page.mouse.move(0, 0);
        await page.getByRole("button", { name: `About ${title}` }).hover();
        await expect(opened).toBeVisible({ timeout: 3000 });
      }).toPass({ timeout: scaleTimeout(20000) });
      return opened;
    };
    const wikiLink = (opened) =>
      opened.getByRole("link", { name: "Learn more in the wiki" });

    await risks.goto(project, { tab: "risks" });
    let opened = await card("Risk owner and Owner");
    await expect(opened).toContainText(
      "Risk owner is the person responsible for handling the risk.",
    );
    await expect(wikiLink(opened)).toHaveAttribute(
      "href",
      `${WIKI}/Project-Detail#toolbar-and-register`,
    );
    await expect(wikiLink(opened)).toHaveAttribute("target", "_blank");

    await risks.riskRow(OPEN_RISK).click();
    opened = await card("Updates");
    await expect(wikiLink(opened)).toHaveAttribute(
      "href",
      `${WIKI}/Project-Detail#change-a-risks-status-or-level`,
    );

    await risks.goto(project, { tab: "overview" });
    opened = await card("Budget burn");
    await expect(wikiLink(opened)).toHaveAttribute(
      "href",
      `${WIKI}/Project-Detail#project-summary-details-and-team`,
    );

    // A card without a wiki page leaves the link out.
    await risks.goto(project, { tab: "growth" });
    opened = await card("Activity owner and Ideation owner");
    await expect(opened).toContainText(
      "Activity owner is the person responsible for driving the initiative.",
    );
    await expect(wikiLink(opened)).toHaveCount(0);
  });
});
