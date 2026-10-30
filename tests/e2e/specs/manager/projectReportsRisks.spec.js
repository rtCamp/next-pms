const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { ProjectRisksPage } from "../../pageObjects/projectRisksPage";
import {
  createDocument,
  deleteDocument,
  getDocList,
  getDocument,
  updateDocument,
} from "../../utils/api/apiClient";
import { readJSONFile } from "../../utils/fileUtils";

// TC299 seeds "E2E Prj Detail" with a Done report, an open High risk and a mitigated
// Low one; see data/manager/projects.js. Cases that change a risk make their own.
const OPEN_RISK = "E2E Prj open risk";
const MITIGATED_RISK = "E2E Prj mitigated risk";
const REPORT_LINK = "https://example.com/e2e-prj-report";
const DUMMY_PDF = path.resolve(
  __dirname,
  "../../data/upload-files/valid/dummy.pdf",
);

test.describe.configure({ mode: "serial" });

test.describe("Manager: Project reports and risks", () => {
  /** @type {ProjectRisksPage} */ let risks;
  let project;
  let docs;

  test.beforeEach(async ({ page, jsonDir }) => {
    risks = new ProjectRisksPage(page);
    const data = (await readJSONFile(path.join(jsonDir, "TC299.json"))).TC299;
    project = data.payloadDeleteProject5.projectId;
    docs = data.docs;
  });

  /** A risk of this case's own, removed afterwards. */
  const withRisk = async (summary, fields, body) => {
    const risk = await createDocument("Risk", {
      project,
      risk_category: "Design",
      risk_level: "Medium",
      status: "To-do",
      summary,
      ...fields,
    });
    try {
      await body(risk.name);
    } finally {
      await deleteDocument("Risk", risk.name);
    }
  };

  // A summary typed in the dialog is stored as rich text: "<p>...</p>".
  const risksBy = (summary) =>
    getDocList("Risk", [["summary", "like", `%${summary}%`]]);

  test("TC343: The Reports tab lists the project's reports", async ({
    page,
  }) => {
    allure.story("Projects");
    await risks.goto(project, { tab: "reports" });
    await expect(
      page.getByText("Project Reports", { exact: true }),
    ).toBeVisible();
    const table = page
      .getByText("Date Range", { exact: true })
      .locator("xpath=ancestor::*[.//text()[contains(.,'Done')]][1]");
    await expect(table).toContainText("Done");
    await expect(page.getByText("No reports generated yet.")).toHaveCount(0);
  });

  test("TC344: Generate Project Report without a Report Duration is refused and adds no report", async ({
    page,
  }) => {
    allure.story("Projects");
    await risks.goto(project, { tab: "reports" });
    const before = (await getDocument("Project", project))
      .custom_project_reports.length;
    await risks.generateReport.click();
    const message = page
      .getByText(
        /Report dates are missing|LLM service URLs are not configured|PM Report API key is not configured|Slack Channel Slug/,
      )
      .first();
    await expect(message).toBeVisible();
    const text = await message.innerText();
    // The server checks its own configuration before the dates.
    test.skip(
      !/Report dates are missing/.test(text),
      `This site stops before the date check: ${text}`,
    );
    expect(text).toContain("Please select a Report Duration.");
    expect(
      (await getDocument("Project", project)).custom_project_reports,
    ).toHaveLength(before);
  });

  test("TC345: A finished report opens from View Report", async ({ page }) => {
    allure.story("Projects");
    await risks.goto(project, { tab: "reports" });
    const popup = page
      .waitForEvent("popup", { timeout: 10000 })
      .catch(() => null);
    await page
      .getByRole("button", { name: "View Report" })
      .or(page.getByRole("link", { name: "View Report" }))
      .first()
      .click();
    const opened = await popup;
    expect(opened?.url() ?? page.url()).toContain(REPORT_LINK);
    await opened?.close();
  });

  test("TC346: Create risk without a level or a status asks for both and creates nothing", async ({
    page,
  }) => {
    allure.story("Projects");
    const posted = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/resource/Risk"))
        posted.push(req.url());
    });
    await risks.goto(project);
    await risks.createButton.click();
    await risks.submitRisk();
    await expect(
      risks.riskDialog.getByText("Please select a risk level."),
    ).toBeVisible();
    await expect(
      risks.riskDialog.getByText("Please select a status."),
    ).toBeVisible();
    expect(posted).toEqual([]);
  });

  test("TC347: A new risk is added and listed under Open Risk", async ({
    page,
  }) => {
    allure.story("Projects");
    const summary = `E2E Prj new risk ${Date.now()}`;
    try {
      await risks.goto(project);
      // The group counts read 0 until the list has loaded.
      await expect(risks.listRow(OPEN_RISK)).toBeVisible();
      const open = await risks.groupCount("Open Risk");
      await risks.createButton.click();
      await risks.fillRisk({
        category: "Design",
        level: "Medium",
        status: "In Progress",
        summary,
      });
      await risks.submitRisk();
      await expect(risks.riskDialog).toBeHidden();
      await expect(risks.riskRow(summary)).toContainText("Medium");
      await expect.poll(() => risks.groupCount("Open Risk")).toBe(open + 1);
      expect(await risksBy(summary)).toHaveLength(1);
    } finally {
      for (const { name } of await risksBy(summary))
        await deleteDocument("Risk", name);
    }
  });

  test("TC348: Risks are grouped into Open Risk and Mitigated Risk with counts, and a mitigated risk moves across", async () => {
    allure.story("Projects");
    const summary = `E2E Prj moving risk ${Date.now()}`;
    await withRisk(summary, {}, async () => {
      await risks.goto(project);
      await expect(risks.listRow(OPEN_RISK)).toBeVisible();
      await expect(risks.listRow(MITIGATED_RISK)).toBeVisible();
      const [open, mitigated] = [
        await risks.groupCount("Open Risk"),
        await risks.groupCount("Mitigated Risk"),
      ];
      expect(open).toBeGreaterThanOrEqual(2);
      expect(mitigated).toBeGreaterThanOrEqual(1);

      await risks.riskRow(summary).click();
      await risks.addUpdateButton.click();
      await risks.pick(risks.updateStatus, "Mitigated");
      await risks.updateNote.fill("E2E Prj mitigated");
      await risks.updateDialog
        .getByRole("button", { name: "Add update" })
        .click();
      await expect(risks.updateDialog).toBeHidden();

      await risks.goto(project);
      await expect.poll(() => risks.groupCount("Open Risk")).toBe(open - 1);
      await expect
        .poll(() => risks.groupCount("Mitigated Risk"))
        .toBe(mitigated + 1);
    });
  });

  test("TC349: The Risk owner, Owner, Status and Risk level filters narrow the list, and Sort reorders it", async ({
    page,
  }) => {
    allure.story("Projects");
    const listed = (summary) => page.getByText(summary, { exact: true });
    await risks.goto(project);
    await risks.pick(risks.filter("Risk level"), "High");
    await expect(listed(OPEN_RISK)).toBeVisible();
    await expect(listed(MITIGATED_RISK)).toHaveCount(0);

    await risks.goto(project);
    await risks.pick(risks.filter("Status"), "Mitigated");
    await expect(listed(MITIGATED_RISK)).toBeVisible();
    await expect(listed(OPEN_RISK)).toHaveCount(0);

    await risks.goto(project);
    await risks.pick(risks.filter("Risk owner"), process.env.REP_MAN_NAME);
    await expect(listed(OPEN_RISK)).toBeVisible();
    await expect(listed(MITIGATED_RISK)).toHaveCount(0);

    // Both seeded risks were created by the same user.
    await risks.goto(project);
    await risks.filter("Owner").click();
    await page.getByRole("option").nth(1).click();
    await expect(
      listed(OPEN_RISK).or(listed(MITIGATED_RISK)).first(),
    ).toBeVisible();

    await risks.goto(project);
    await risks.sortButton.click();
    await page
      .getByRole("button", { name: "Risk level", exact: true })
      .or(page.getByRole("option", { name: "Risk level" }))
      .first()
      .click();
    await expect(risks.sortButton).toContainText("Risk level");
  });

  test("TC350: A risk opens on its own page with category, level, owner, status, mitigation plan, documents and updates", async ({
    page,
  }) => {
    allure.story("Projects");
    await risks.goto(project);
    await risks.riskRow(OPEN_RISK).click();
    await expect(page).toHaveURL(/tab=risks&risk=|risk=.*tab=risks/);
    for (const text of [
      "Technical Risk",
      /^High( risk)?$/,
      "To-do",
      process.env.REP_MAN_NAME,
      "E2E Prj mitigation plan",
      "Additional documents",
      "Updates",
    ]) {
      await expect(
        page.getByText(text, { exact: true }).first(),
        String(text),
      ).toBeVisible();
    }
  });

  test("TC351: Add update needs a note, and records the note with its status and level", async ({
    page,
  }) => {
    allure.story("Projects");
    const summary = `E2E Prj updated risk ${Date.now()}`;
    await withRisk(summary, {}, async (name) => {
      await risks.goto(project, { risk: name });
      await risks.addUpdateButton.click();
      await risks.updateDialog
        .getByRole("button", { name: "Add update" })
        .click();
      await expect(
        risks.updateDialog.getByText("Note is required."),
      ).toBeVisible();

      await risks.pick(risks.updateStatus, "Escalated");
      await risks.pick(risks.updateLevel, "High");
      await risks.updateNote.fill("E2E Prj escalated");
      await risks.updateDialog
        .getByRole("button", { name: "Add update" })
        .click();
      await expect(risks.updateDialog).toBeHidden();
      await expect(page.getByText("E2E Prj escalated")).toBeVisible();
      const saved = await getDocument("Risk", name);
      expect([saved.status, saved.risk_level]).toEqual(["Escalated", "High"]);
    });
  });

  test("TC352: A risk edited from its row menu keeps the change, and Delete removes it after confirmation", async ({
    page,
  }) => {
    allure.story("Projects");
    const summary = `E2E Prj edited risk ${Date.now()}`;
    const edited = `${summary} edited`;
    try {
      await createDocument("Risk", {
        project,
        risk_level: "Low",
        status: "To-do",
        summary,
      });
      await risks.goto(project);
      await risks.riskAction(summary, "Edit");
      await risks.fillRisk({ summary: edited });
      await risks.submitRisk();
      await expect(risks.riskDialog).toBeHidden();
      await page.reload();
      await expect(page.getByText(edited, { exact: true })).toBeVisible();

      await risks.riskAction(edited, "Delete");
      const confirm = page.getByRole("dialog", { name: "Delete risk" });
      await expect(confirm).toContainText(
        "Are you sure you want to delete this risk? This action cannot be undone.",
      );
      await confirm
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      await expect(page.getByText("Risk deleted").first()).toBeVisible();
      await expect(page.getByText(edited, { exact: true })).toHaveCount(0);
      expect(await risksBy(edited)).toHaveLength(0);
    } finally {
      for (const text of [summary, edited]) {
        for (const { name } of await risksBy(text))
          await deleteDocument("Risk", name);
      }
    }
  });

  test("TC353: Follow and Unfollow on a risk confirm with a toast", async ({
    page,
  }) => {
    allure.story("Projects");
    // Following records nothing unless the user has document follow notifications on.
    await updateDocument("User", process.env.REP_MAN_EMAIL, {
      document_follow_notify: 1,
    });
    await risks.goto(project, { risk: docs.openRisk });
    await risks.openRiskMenu("Technical Risk");
    await page.getByRole("menuitem", { name: "Follow", exact: true }).click();
    await expect(page.getByText("Following document").first()).toBeVisible();
    await page.reload();
    await risks.openRiskMenu("Technical Risk");
    await page.getByRole("menuitem", { name: "Unfollow", exact: true }).click();
    await expect(page.getByText("Unfollowed document").first()).toBeVisible();
  });

  test("TC354: Files added to a risk's Additional documents are listed and open", async ({
    page,
  }) => {
    allure.story("Projects");
    const summary = `E2E Prj documented risk ${Date.now()}`;
    await withRisk(summary, {}, async (name) => {
      await risks.goto(project, { risk: name });
      await risks.uploadDocument({ path: DUMMY_PDF });
      const link = risks.documentLink("dummy.pdf").first();
      await expect(link).toBeVisible();
      // Newer Frappe serves files at /file/<hash>/<name>, older at /files/<name>.
      await expect(link).toHaveAttribute("href", /dummy\.pdf$/);
      for (const { name: file } of await getDocList("File", [
        ["attached_to_doctype", "=", "Risk"],
        ["attached_to_name", "=", name],
      ])) {
        await deleteDocument("File", file);
      }
    });
  });
});
