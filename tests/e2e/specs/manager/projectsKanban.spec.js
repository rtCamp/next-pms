const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { ProjectsListPage } from "../../pageObjects/projectsListPage";
import {
  getDocList,
  getDocument,
  updateDocument,
} from "../../utils/api/apiClient";
import { deleteProject } from "../../utils/api/projectRequests";
import { readJSONFile } from "../../utils/fileUtils";

// TC299 seeds the projects; see data/manager/projects.js.
const KANBAN = "E2E Prj Kanban";
const PHASES = [
  "Delivery Prep",
  "Kick Off",
  "Discovery",
  "Development",
  "Launch",
  "Close Out",
];
const COMPANY = "rtCamp Solutions Pvt. Ltd.";

// The board shows only the 20 most recently changed matching projects, so each case
// narrows it to its own; the drag case changes the Kanban project's phase.
test.describe.configure({ mode: "serial" });

test.describe("Manager: Projects Kanban and Add project", () => {
  /** @type {ProjectsListPage} */ let list;
  let data;
  let kanbanId;

  test.beforeEach(async ({ page, jsonDir }) => {
    list = new ProjectsListPage(page);
    data = (await readJSONFile(path.join(jsonDir, "TC299.json"))).TC299;
    kanbanId = data.payloadDeleteProject4.projectId;
    await updateDocument("Project", kanbanId, {
      custom_project_phase: "Discovery",
    });
  });

  const COLOURED = {
    search: "E2E Prj",
    rag: JSON.stringify(["red", "amber", "green"]),
  };

  const board = (params) =>
    list.page
      .goto(
        `/next-pms/projects?${new URLSearchParams({ view: "kanban", ...params })}`,
      )
      .then(() => list.kanbanColumn("Delivery Prep").waitFor());

  test("TC317: The Kanban view groups projects into phase columns", async () => {
    allure.story("Projects");
    await board({
      search: "E2E Prj",
      rag: JSON.stringify(["red", "amber", "green"]),
    });
    const labels = await list.page
      .getByText(new RegExp(`^(${PHASES.join("|")})$`))
      .allInnerTexts();
    expect(labels).toEqual(PHASES);
    for (const [project, phase] of [
      ["E2E Prj Red", "Kick Off"],
      ["E2E Prj Amber", "Development"],
      ["E2E Prj Green", "Launch"],
    ]) {
      await expect(list.kanbanColumn(phase).getByRole("link")).toContainText([
        project,
      ]);
    }
  });

  test("TC318: Clicking a Kanban card, or pressing Enter on it, opens the project", async ({
    page,
  }) => {
    allure.story("Projects");
    await board({ search: KANBAN });
    await list.card(KANBAN).click();
    await expect(page).toHaveURL(new RegExp(`/next-pms/projects/${kanbanId}`));

    await board({ search: KANBAN });
    await list.card(KANBAN).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/next-pms/projects/${kanbanId}`));
  });

  test("TC319: Dragging a card to another phase changes the project's phase; a failed move puts it back", async ({
    page,
  }) => {
    allure.story("Projects");
    // Kick Off is near the left edge and holds the Red project: a drop near the right
    // edge auto-scrolls the board, and a drop on an empty column is ignored.
    await board(COLOURED);
    await expect(list.kanbanColumn("Discovery")).toContainText(KANBAN);

    await page.route(`**/api/resource/Project/${kanbanId}`, (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({ status: 500, body: "{}" })
        : route.continue(),
    );
    await list.dragCard(KANBAN, "Kick Off");
    await expect(
      page.getByText(`Error updating the phase for ${KANBAN}`).first(),
    ).toBeVisible();
    await expect(list.kanbanColumn("Discovery")).toContainText(KANBAN);
    await page.unroute(`**/api/resource/Project/${kanbanId}`);

    await list.dragCard(KANBAN, "Kick Off");
    await expect(list.kanbanColumn("Kick Off")).toContainText(KANBAN);
    await expect
      .poll(
        async () =>
          (await getDocument("Project", kanbanId)).custom_project_phase,
      )
      .toBe("Kick Off");
  });

  test("TC320: The + on a phase column opens Add Project with that phase chosen", async () => {
    allure.story("Projects");
    await board({ search: KANBAN });
    await list.kanbanColumn("Development").getByRole("button").first().click();
    await expect(list.addProjectDialog).toBeVisible();
    await expect(
      list.addProjectDialog.getByRole("combobox").first(),
    ).toHaveText("Development");
  });

  test("TC321: Add Project with empty fields asks for a name, a company and a customer and creates nothing", async ({
    page,
  }) => {
    allure.story("Projects");
    const posted = [];
    page.on("request", (req) => {
      if (
        req.method() === "POST" &&
        req.url().endsWith("/api/resource/Project")
      )
        posted.push(req.url());
    });
    await list.open({ search: KANBAN });
    await list.addProjectButton.click();
    await list.addProjectDialog
      .getByRole("button", { name: "Add Project" })
      .click();
    for (const message of [
      "Enter Project Name",
      "Select Company",
      "Select Customer",
    ]) {
      await expect(
        list.addProjectDialog.getByText(message, { exact: true }),
      ).toBeVisible();
    }
    expect(posted).toEqual([]);
  });

  test("TC322: Add Project saves the project with its customer", async () => {
    allure.story("Projects");
    const name = `E2E Prj Added ${Date.now()}`;
    try {
      await list.open({ search: KANBAN });
      await list.addProjectButton.click();
      await list.fillAddProject({ name, company: COMPANY, customer: "QA-USD" });
      await list.addProjectDialog
        .getByRole("button", { name: "Add Project" })
        .click();
      await expect(
        list.page.getByText("Project created successfully").first(),
      ).toBeVisible();
      await list.open({ search: name });
      await expect.poll(() => list.names()).toEqual([name]);
      await expect(await list.cell(name, "Client name")).toContainText(
        "QA-USD",
      );
    } finally {
      for (const { name: id } of await getDocList("Project", [
        ["project_name", "=", name],
      ])) {
        await deleteProject(id);
      }
    }
  });
});
