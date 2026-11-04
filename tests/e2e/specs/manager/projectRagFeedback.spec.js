const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { ProjectDetailsPage } from "../../pageObjects/projectDetailsPage";
import { readJSONFile } from "../../utils/fileUtils";

// RAG stats and Feedback come from the rtcamp app: where it is not installed (a fresh
// site, CI) the tabs are absent and these cases skip. TC299 seeds the project.
test.describe.configure({ mode: "serial" });

test.describe("Manager: Project RAG stats and Feedback", () => {
  /** @type {ProjectDetailsPage} */ let details;
  let project;

  test.beforeEach(async ({ page, jsonDir }) => {
    details = new ProjectDetailsPage(page);
    const data = (await readJSONFile(path.join(jsonDir, "TC299.json"))).TC299;
    project = data.payloadDeleteProject5.projectId;
  });

  /** Opens the tab, or skips when the site does not offer it. */
  const open = async (tab, flag) => {
    await details.goto(project);
    test.skip(
      !(await details.boot(flag)),
      `This site has no ${tab} tab (rtcamp app not installed)`,
    );
    await details.tab(tab).click();
  };

  test("TC355: The RAG stats tab shows the status, its triggers and history", async ({
    page,
  }) => {
    allure.story("Projects");
    await open("RAG stats", "show_rag_trigger_page");
    await expect(page).toHaveURL(/tab=rag-stats/);
    for (const text of [
      "RAG Status Details",
      "Current Status:",
      "Status Triggers:",
      "Status History:",
      "Comments",
    ]) {
      await expect(
        page.getByText(text, { exact: true }).first(),
        text,
      ).toBeVisible();
    }
  });

  test("TC356: A RAG stats comment can be added, replied to, edited and deleted by its author", async ({
    page,
  }) => {
    allure.story("Projects");
    test.setTimeout(180000);
    await open("RAG stats", "show_rag_trigger_page");
    const stamp = Date.now();
    const [comment, reply, edited] = [
      `E2E Prj comment ${stamp}`,
      `E2E Prj reply ${stamp}`,
      `E2E Prj comment edited ${stamp}`,
    ];
    const text = (value) => page.getByText(value, { exact: true });
    /** Reply, Edit and Delete sit under a comment's text and show while it is hovered. */
    const act = async (value, name) => {
      const paragraph = page.getByRole("paragraph").filter({
        hasText: new RegExp(`^${value}$`),
      });
      await paragraph.hover();
      // The text sits in an editor inside a bubble; the buttons follow the bubble, and
      // a comment's own come before its replies'.
      await paragraph
        .locator("xpath=../../..")
        .getByRole("button", { name, exact: true })
        .first()
        .click();
    };
    const remove = async (value) => {
      await act(value, "Delete");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      await expect(text(value)).toHaveCount(0);
    };

    // Comments a failed attempt left behind.
    const leftovers = page.getByText(
      /^E2E Prj (comment|reply|comment edited) \d+$/,
    );
    for (let step = 0; step < 10 && (await leftovers.count()); step++) {
      await remove(await leftovers.last().innerText());
    }

    const box = page
      .getByPlaceholder("Add a comment")
      .or(page.locator("[data-placeholder='Add a comment']"))
      .first();
    await box.click();
    await box.fill(comment);
    await page
      .getByRole("button", { name: "Post", exact: true })
      .first()
      .click();
    await expect(text(comment)).toBeVisible();

    await act(comment, "Reply");
    await page.locator("[contenteditable=true]").last().fill(reply);
    await page
      .getByRole("button", { name: /^(Post|Reply)$/ })
      .last()
      .click();
    await expect(text(reply)).toBeVisible();

    await act(comment, "Edit");
    await page
      .locator("[contenteditable=true]")
      .filter({ hasText: comment })
      .first()
      .fill(edited);
    await page
      .getByRole("button", { name: /^(Save|Update)$/ })
      .first()
      .click();
    await expect(text(edited)).toBeVisible();

    await remove(reply);
    await remove(edited);
  });

  test("TC357: The Feedback tab shows the project's client feedback", async ({
    page,
  }) => {
    allure.story("Projects");
    await open("Feedback", "has_customer_feedback");
    await expect(page).toHaveURL(/tab=feedback/);
    await expect(
      page.getByRole("button", { name: "Client feedback" }),
    ).toBeVisible();
    await expect(page.getByText("Schedule Feedback").first()).toBeVisible();
  });

  test("TC358: The Feedback tab switches to Team feedback with its columns", async ({
    page,
  }) => {
    allure.story("Projects");
    await open("Feedback", "has_customer_feedback");
    await page.getByRole("button", { name: "Client feedback" }).click();
    await page
      .getByRole("menuitem", { name: "Team feedback" })
      .or(page.getByRole("option", { name: "Team feedback" }))
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "Team feedback" }),
    ).toBeVisible();
    for (const column of ["From", "To", "Member", "Customer", "Avg. Rating"]) {
      await expect(
        page.getByText(column, { exact: true }).first(),
        column,
      ).toBeVisible();
    }
  });
});
