import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";
import { GrowthPage } from "./growthPage";

/**
 * A project's Risks and Reports tabs. Risks shares Growth's Add update, Add document
 * and document helpers.
 */
export class ProjectRisksPage extends GrowthPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.createButton = page.getByRole("button", {
      name: "Create",
      exact: true,
    });
    this.riskDialog = page.getByRole("dialog", {
      name: /^(Create|Edit) risk$/,
    });
    this.updateDialog = page.getByRole("dialog", {
      name: /^(Add|Edit) update$/,
    });
    // Add update opens on the risk's current status and level, so its selects show values.
    this.updateStatus = this.updateDialog.getByRole("combobox").nth(0);
    this.updateLevel = this.updateDialog.getByRole("combobox").nth(1);
    this.updateNote = this.updateDialog.locator("[contenteditable]").first();
    this.sortButton = page.getByRole("button", { name: /^Sort/ }).first();
    this.generateReport = page.getByRole("button", {
      name: "Generate Project Report",
    });
  }

  async goto(projectId, { tab = "risks", risk } = {}) {
    const query = new URLSearchParams({ tab, ...(risk ? { risk } : {}) });
    await gotoWithRetry(this.page, `/next-pms/projects/${projectId}?${query}`);
    await this.page
      .getByRole("tab", { name: "Overview" })
      .waitFor({ timeout: scaleTimeout(30000) });
  }

  /** A group's heading carries its count: "Open Risk 3". */
  async groupCount(label) {
    const heading = this.page.getByRole("heading", {
      name: new RegExp(`^${label} \\d+$`),
    });
    await heading.waitFor({ timeout: scaleTimeout(15000) });
    return Number((await heading.textContent()).replace(/\D/g, ""));
  }

  /** A risk's row, found by its summary; its last button opens the row menu. */
  riskRow(summary) {
    return this.page
      .getByText(summary, { exact: true })
      .first()
      .locator("xpath=ancestor::*[.//button][1]");
  }

  async riskAction(summary, action) {
    await this.riskRow(summary).getByRole("button").last().click();
    await this.page
      .getByRole("menuitem", { name: action, exact: true })
      .click();
  }

  /** On a risk's page, the menu button sits two levels above its title. */
  async openRiskMenu(title) {
    await this.page
      .getByText(title, { exact: true })
      .first()
      .locator("xpath=ancestor::div[2]")
      .locator("button[aria-haspopup='menu']")
      .click();
  }

  /** A toolbar filter is a combobox showing its label until something is chosen. */
  filter(label) {
    return this.page.getByRole("combobox").filter({ hasText: label }).first();
  }

  /** Level options read "High risk"; the rest are the value itself. */
  async pick(combobox, option) {
    await combobox.click();
    await this.page
      .getByRole("option", { name: new RegExp(`^${option}( risk)?$`) })
      .first()
      .click();
  }

  /** A select in the risk or update dialog: named by its placeholder, or showing it as text. */
  dialogSelect(dialog, placeholder) {
    return dialog
      .getByRole("combobox", { name: placeholder })
      .or(dialog.getByRole("combobox").filter({ hasText: placeholder }))
      .first();
  }

  async fillRisk({ category, level, status, summary }) {
    const d = this.riskDialog;
    if (category)
      await this.pick(this.dialogSelect(d, "Select category"), category);
    if (level) await this.pick(this.dialogSelect(d, "Select level"), level);
    if (status) await this.pick(this.dialogSelect(d, "Select status"), status);
    if (summary) {
      await d
        .getByPlaceholder("Describe the risk...")
        .or(d.locator("[contenteditable]").first())
        .first()
        .fill(summary);
    }
  }

  async submitRisk() {
    await this.riskDialog
      .getByRole("button", { name: /^(Create|Save)$/ })
      .click();
  }
}
