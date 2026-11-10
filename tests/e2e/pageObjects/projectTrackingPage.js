import { expect } from "allure-playwright";
import { dayOfThisMonth } from "../utils/dateUtils";
import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";

/**
 * A project's Tracking tab and the "About this project" sidebar beside it,
 * which show the same money and hours in two layouts.
 */
export class ProjectTrackingPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.heading = page.getByRole("heading", {
      name: "Tracking",
      exact: true,
      level: 2,
    });
    this.tab = page.getByRole("tabpanel");
    this.sidebar = page.locator("section").filter({
      has: page.getByRole("heading", { name: "About this project" }),
    });

    // A widget is a section named by its title.
    this.card = (title) =>
      this.tab.getByRole("region", { name: title, exact: true });
    this.contractsCard = this.card("Contracts");
    this.ratesCard = this.card("Project rates");

    // The Financials card has no title; its first figure is a link to the Sales Orders.
    this.totalProjectValueLink = page.getByRole("link", {
      name: /^Total project value/,
    });
    this.financialsMenuButton = page.getByRole("button", {
      name: "Switch financial figures",
    });

    // Customizing the layout
    this.editButton = page.getByRole("button", { name: "Edit", exact: true });
    this.doneButton = page.getByRole("button", { name: "Done", exact: true });
    this.addWidgetsButton = page.getByRole("button", { name: "Add widgets" });
    this.removeWidgetDialog = page.getByRole("dialog", {
      name: "Remove widget",
    });
    this.addWidgetsDialog = page.getByRole("dialog", { name: "Add widgets" });

    // Contracts and rates share one row-actions menu
    this.addContractDialog = page.getByRole("dialog", { name: "Add contract" });
    this.editContractDialog = page.getByRole("dialog", {
      name: "Edit contract",
    });
    this.addRateDialog = page.getByRole("dialog", {
      name: "Add project rate",
    });
    this.editRateDialog = page.getByRole("dialog", {
      name: "Edit project rate",
    });
    this.confirmDeleteDialog = page.getByRole("dialog", {
      name: /^Delete (contract|rate)$/,
    });

    this.toastRegion = page.getByRole("region", { name: /notification/i });
    this.toasts = this.toastRegion.locator("[data-sonner-toast]");
    // `.first()`: a previous toast with the same text can still be on screen.
    this.toast = (text) => this.toastRegion.getByText(text).first();
  }

  // --------------------------------------
  // Navigation
  // --------------------------------------

  /** Opens a project's Tracking tab once the tab and the sidebar have loaded. */
  async goto(projectId) {
    await gotoWithRetry(
      this.page,
      `/next-pms/projects/${projectId}?tab=tracking`,
    );
    await this.heading.waitFor({ timeout: scaleTimeout(40000) });
    await this.sidebarSection("Progress (hours)").waitFor({
      timeout: scaleTimeout(40000),
    });
  }

  /** Waits until no toast is on screen. */
  async waitForToastsToClear() {
    await expect(this.toasts).toHaveCount(0, {
      timeout: scaleTimeout(15000),
    });
  }

  // --------------------------------------
  // Reading figures
  // --------------------------------------

  /**
   * The figure printed after a label. The widgets lay a label and its figure out
   * differently, but the figure is always the next text after the label.
   */
  valueOf(label, scope = this.tab) {
    return scope
      .getByText(label, { exact: true })
      .first()
      .locator("xpath=(following::span[normalize-space()])[1]");
  }

  /** A sidebar section by its title; the accordion panel carries it as its name. */
  sidebarSection(title) {
    return this.sidebar.getByRole("region", { name: title });
  }

  /** Hovers a sidebar label and returns the hint it reveals. */
  async hintOf(label, hint) {
    await this.sidebar.getByText(label, { exact: true }).hover();
    return this.page.getByRole("tooltip", { name: hint, exact: true });
  }

  /** Switches the Financials card between "Projected" and "Current". */
  async showFinancials(mode) {
    await this.financialsMenuButton.click();
    await this.page.getByRole("menuitem", { name: mode }).click();
  }

  // --------------------------------------
  // Layout
  // --------------------------------------

  async removeWidget(label) {
    await this.page.getByRole("button", { name: `Remove ${label}` }).click();
    await this.removeWidgetDialog
      .getByRole("button", { name: "Remove", exact: true })
      .click();
    await this.toast("Tracking layout updated").waitFor({
      timeout: scaleTimeout(15000),
    });
  }

  /** Puts widgets back from the Add widgets dialog and saves. */
  async addWidgets(labels) {
    await this.addWidgetsButton.click();
    for (const label of labels) {
      await this.addWidgetsDialog
        .getByRole("listitem")
        .filter({ hasText: label })
        .getByRole("button", { name: "Add" })
        .click();
    }
    await this.addWidgetsDialog.getByRole("button", { name: "Save" }).click();
    await this.toast("Tracking layout updated").waitFor({
      timeout: scaleTimeout(15000),
    });
  }

  // --------------------------------------
  // Contracts
  // --------------------------------------

  get contractRows() {
    return this.contractsCard.getByRole("row").filter({
      has: this.page.getByRole("button", { name: "Contract actions" }),
    });
  }

  /** A row's printed values in column order: dates, the three hour figures and the two links. */
  rowValues(row) {
    return row.getByRole("cell").locator("xpath=./span");
  }

  async openRowMenu(row, action) {
    await row.getByRole("button", { name: /actions/ }).click();
    await this.page.getByRole("menuitem", { name: action }).click();
  }

  /** Types a day of this month into a date field and commits it. */
  async pickDay(field, day) {
    await field.fill(dayOfThisMonth(day));
    await field.press("Enter");
  }

  async fillContract(dialog, { startDay, endDay, hours }) {
    if (startDay) {
      await this.pickDay(
        dialog.getByRole("combobox", { name: /^Start date/ }),
        startDay,
      );
    }
    if (endDay) {
      await this.pickDay(
        dialog.getByRole("combobox", { name: /^End date/ }),
        endDay,
      );
    }
    if (hours) await dialog.getByRole("spinbutton").fill(String(hours));
  }

  // --------------------------------------
  // Project rates
  // --------------------------------------

  // One row per member rate; the flat rate row above them has no actions.
  get rateRows() {
    return this.ratesCard.getByRole("row").filter({
      has: this.page.getByRole("button", { name: /^Rate actions for / }),
    });
  }

  async fillRate(dialog, { member, rate, day }) {
    if (member) {
      await dialog.getByRole("combobox", { name: /^Member/ }).click();
      await this.page.getByRole("option", { name: member }).click();
    }
    if (rate) await dialog.getByRole("spinbutton").fill(String(rate));
    if (day) {
      await this.pickDay(
        dialog.getByRole("combobox", { name: /^Valid from/ }),
        day,
      );
    }
  }
}
