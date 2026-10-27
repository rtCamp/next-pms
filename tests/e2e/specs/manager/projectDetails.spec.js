const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { ProjectDetailsPage } from "../../pageObjects/projectDetailsPage";
import { ProjectsListPage } from "../../pageObjects/projectsListPage";
import { request } from "@playwright/test";
import {
  baseURL,
  deleteDocument,
  getDocList,
  getDocument,
  loadAuthState,
  updateDocument,
} from "../../utils/api/apiClient";
import { readJSONFile } from "../../utils/fileUtils";

// TC299 seeds the "E2E Prj Detail" project these cases open; see data/manager/projects.js.
const DETAIL = "E2E Prj Detail";
const SUMMARY = "<p>E2E Prj detail summary</p>";
const CONTACT = "E2E Prj Contact";

// The cases edit the same project, so they run in order and put it back.
test.describe.configure({ mode: "serial" });

test.describe("Manager: Project details", () => {
  /** @type {ProjectDetailsPage} */ let details;
  let data;
  let project;

  test.beforeEach(async ({ page, jsonDir }) => {
    details = new ProjectDetailsPage(page);
    data = (await readJSONFile(path.join(jsonDir, "TC299.json"))).TC299;
    project = data.payloadDeleteProject5.projectId;
  });

  const restore = () =>
    updateDocument("Project", project, {
      priority: "Medium",
      custom_executive_summary: SUMMARY,
      custom_project_manager: "",
      custom_engineering_manager: "",
      custom_customer_contacts: [],
    });

  /** Who the project is shared with, read from its DocShare rows. */
  const sharedWith = async () =>
    (
      await getDocList(
        "DocShare",
        [
          ["share_doctype", "=", "Project"],
          ["share_name", "=", project],
          ["read", "=", 1],
        ],
        { fields: ["user"] },
      )
    ).map((row) => row.user);

  test("TC323: ?tab= opens that tab, and an unknown tab falls back to Overview", async ({
    page,
  }) => {
    allure.story("Projects");
    await details.goto(project, "risks");
    expect(await details.selectedTab()).toBe("Risks");
    await expect(page).toHaveURL(/tab=risks/);

    await details.goto(project, "no-such-tab");
    expect(await details.selectedTab()).toBe("Overview");
    await expect(page).not.toHaveURL(/tab=/);
  });

  test("TC324: Reports, Feedback and RAG stats show only when their switch is on", async () => {
    allure.story("Projects");
    // Reports follows the project's own setting.
    await details.goto(project);
    await expect(details.tab("Reports")).toBeVisible();
    await details.goto(data.payloadDeleteProject.projectId);
    await expect(details.tab("Reports")).toHaveCount(0);

    // Feedback and RAG stats follow site-wide switches (on where the rtcamp app is installed).
    for (const [tab, flag] of [
      ["Feedback", "has_customer_feedback"],
      ["RAG stats", "show_rag_trigger_page"],
    ]) {
      await expect(details.tab(tab), tab).toHaveCount(
        (await details.boot(flag)) ? 1 : 0,
      );
    }
  });

  test("TC325: The Overview shows the project's details, members and customers", async ({
    page,
  }) => {
    allure.story("Projects");
    await restore();
    await details.goto(project);
    await expect(details.overviewHeading).toBeVisible();
    await expect(page.getByText("E2E Prj detail summary")).toBeVisible();
    await expect(
      page.getByText("Medium", { exact: true }).first(),
    ).toBeVisible();
    for (const text of [
      DETAIL,
      "QA-INR",
      "Delivery Prep",
      "Members",
      "Customers",
    ]) {
      await expect(
        page.getByText(text, { exact: true }).first(),
        text,
      ).toBeVisible();
    }
    // Shared with EMP3 at seed time.
    await expect(page.getByText(process.env.EMP3_NAME).first()).toBeVisible();
  });

  test("TC326: Edited project details are saved and persist after a reload", async ({
    page,
  }) => {
    allure.story("Projects");
    await restore();
    try {
      await details.goto(project);
      await details.editButton.click();
      await details.choose(details.overviewField("Priority"), "High");
      await details.detailsEditor.fill("E2E Prj summary edited");
      await details.saveButton.click();
      await expect(page.getByText("Overview updated").first()).toBeVisible();

      await page.reload();
      await expect(page.getByText("E2E Prj summary edited")).toBeVisible();
      const saved = await getDocument("Project", project);
      expect(saved.priority).toBe("High");
      expect(saved.custom_executive_summary).toContain(
        "E2E Prj summary edited",
      );
    } finally {
      await restore();
    }
  });

  test("TC327: Cancel while editing the Overview discards the changes", async ({
    page,
  }) => {
    allure.story("Projects");
    await restore();
    const writes = [];
    page.on("request", (req) => {
      if (
        req.method() === "PUT" &&
        req.url().includes("/api/resource/Project/")
      )
        writes.push(req.url());
    });
    await details.goto(project);
    await details.editButton.click();
    await details.choose(details.overviewField("Priority"), "Low");
    await details.detailsEditor.fill("E2E Prj discarded");
    await details.cancelButton.click();
    await expect(details.editButton).toBeVisible();
    await expect(page.getByText("E2E Prj detail summary")).toBeVisible();
    expect(writes).toEqual([]);
    expect((await getDocument("Project", project)).priority).toBe("Medium");
  });

  test("TC328: Open in Desk opens the project's Desk form", async ({
    page,
  }) => {
    allure.story("Projects");
    await details.goto(project);
    const popup = page
      .waitForEvent("popup", { timeout: 5000 })
      .catch(() => null);
    await details.openInDesk.click();
    const opened = (await popup) ?? page;
    await expect(opened).toHaveURL(new RegExp(`/desk/project/${project}`));
  });

  test("TC329: The Project Manager and Lead Engineer chosen in the sidebar show on the project and in the Projects list", async ({
    page,
  }) => {
    allure.story("Projects");
    await restore();
    try {
      await details.goto(project);
      await details.pickPerson(
        details.projectManager,
        process.env.REP_MAN_NAME,
      );
      await details.pickPerson(details.leadEngineer, process.env.EMP3_NAME);
      await expect
        .poll(async () => {
          const saved = await getDocument("Project", project);
          return [
            saved.custom_project_manager,
            saved.custom_engineering_manager,
          ];
        })
        .toEqual([process.env.REP_MAN_EMAIL, process.env.EMP3_EMAIL]);

      const list = new ProjectsListPage(page);
      await list.open({ search: DETAIL });
      await expect(await list.cell(DETAIL, "Project manager")).toContainText(
        process.env.REP_MAN_NAME,
      );
      await expect(await list.cell(DETAIL, "Lead engineer")).toContainText(
        process.env.EMP3_NAME,
      );
    } finally {
      await restore();
    }
  });

  test("TC330: A member can be added to the project and removed again", async ({
    page,
  }) => {
    allure.story("Projects");
    const member = process.env.EMP2_NAME;
    try {
      await details.goto(project);
      await details.addMemberButton.click();
      await details.toggleInDialog(
        details.membersDialog,
        member,
        member,
        "Add",
      );
      await expect.poll(sharedWith).toContain(process.env.EMP2_EMAIL);
      await page.keyboard.press("Escape");
      await expect(page.getByText(member).first()).toBeVisible();

      await details.addMemberButton.click();
      await details.toggleInDialog(
        details.membersDialog,
        member,
        member,
        "Remove",
      );
      await expect.poll(sharedWith).not.toContain(process.env.EMP2_EMAIL);
    } finally {
      for (const { name } of await getDocList("DocShare", [
        ["share_doctype", "=", "Project"],
        ["share_name", "=", project],
        ["user", "=", process.env.EMP2_EMAIL],
      ])) {
        await deleteDocument("DocShare", name);
      }
    }
  });

  test("TC331: A customer contact can be added to the project", async ({
    page,
  }) => {
    allure.story("Projects");
    // The dialog lists the customer's contacts as the manager sees them; the app ships
    // no Contact permission for Projects Manager, so on some sites the list is empty.
    const context = await request.newContext({
      baseURL,
      storageState: loadAuthState("manager"),
    });
    const visible = await context
      .get("/api/method/frappe.client.get_list", {
        params: {
          doctype: "Contact",
          filters: JSON.stringify([["name", "=", data.docs.contact]]),
        },
      })
      .then((res) => res.json());
    await context.dispose();
    test.skip(
      !visible.message?.length,
      "The Projects Manager cannot read Contacts on this site, so Add customers lists none",
    );
    await restore();
    try {
      await details.goto(project);
      await details.addCustomerButton.click();
      await details.toggleInDialog(
        details.customersDialog,
        CONTACT,
        CONTACT,
        "Add",
      );
      await expect
        .poll(async () =>
          (await getDocument("Project", project)).custom_customer_contacts.map(
            (row) => row.contact,
          ),
        )
        .toEqual([data.docs.contact]);
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("link", { name: `Open ${CONTACT}` }).first(),
      ).toBeVisible();
    } finally {
      await restore();
    }
  });

  test("TC332: A repository can be connected to the project", async ({
    page,
  }) => {
    allure.story("Projects");
    await details.goto(project);
    test.skip(
      !(await details.boot("has_repository_connections")),
      "This site has no GitHub Repository doctype, so the section is not shown",
    );
    await updateDocument("Project", project, {
      custom_project_repository_connections: [],
    });
    await details.goto(project);
    await page.getByRole("button", { name: "Connect repository" }).click();
    await details.repoDialog
      .getByRole("button", { name: "Add", exact: true })
      .first()
      .click();
    // The dialog closes and the repository is listed in the section.
    await expect(details.repoDialog).toBeHidden();
    await expect(
      details.repoSection.getByRole("link", { name: /\S+\/\S+/ }),
    ).toHaveCount(1);
    expect(
      (await getDocument("Project", project))
        .custom_project_repository_connections,
    ).toHaveLength(1);
    await updateDocument("Project", project, {
      custom_project_repository_connections: [],
    });
  });

  test("TC333: A connected repository can be disconnected", async ({
    page,
  }) => {
    allure.story("Projects");
    await details.goto(project);
    test.skip(
      !(await details.boot("has_repository_connections")),
      "This site has no GitHub Repository doctype, so the section is not shown",
    );
    try {
      const [repo] = await getDocList("GitHub Repository", [], { limit: 1 });
      test.skip(!repo, "This site has no GitHub Repository to connect");
      await updateDocument("Project", project, {
        custom_project_repository_connections: [
          { github_repository: repo.name },
        ],
      });
      await details.goto(project);
      // The row's menu is the section's last button; Connect repository is its first.
      await details.repoSection.getByRole("button").last().click();
      await page.getByRole("menuitem", { name: "Unlink repository" }).click();
      await expect(page.getByText("No repositories connected")).toBeVisible();
      await expect
        .poll(
          async () =>
            (await getDocument("Project", project))
              .custom_project_repository_connections.length,
        )
        .toBe(0);
    } finally {
      await updateDocument("Project", project, {
        custom_project_repository_connections: [],
      });
    }
  });
});
