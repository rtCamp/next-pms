import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";
import { ProjectPage } from "./projectPage";

/**
 * The Projects list's toolbar, columns, views and Kanban board, on top of the list
 * helpers ProjectPage already has.
 */
export class ProjectsListPage extends ProjectPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.ragPicker = page
      .getByRole("combobox")
      .filter({ hasText: /^(RAG Status|Red|Amber|Green)/ })
      .first();
    // Phases and Status are single selects that show their choice in place of the label.
    this.phaseSelect = page.getByRole("combobox").nth(2);
    this.statusSelect = page.getByRole("combobox").nth(3);
    // The breadcrumb's second button names the open view: "List view", "Kanban view"
    // or a saved view's icon and label.
    this.viewMenu = page.getByRole("banner").getByRole("button").nth(1);
    this.addProjectButton = page
      .getByRole("banner")
      .getByRole("button", { name: "Add project", exact: true });
    this.addProjectDialog = page.getByRole("dialog", { name: "Add Project" });
  }

  /** Opens the list with the URL state given (search, rag, phase, status, ...). */
  async open(params = {}) {
    const query = new URLSearchParams({ view: "list", ...params });
    await gotoWithRetry(this.page, `/next-pms/projects?${query}`);
    await this.projectsTable
      .or(this.noResultsCell)
      .waitFor({ timeout: scaleTimeout(30000) });
  }

  /** Waits for the list to settle on the names given, top to bottom order ignored. */
  async names() {
    return (await this.projectOrder()).sort();
  }

  async pickRag(values) {
    await this.ragPicker.click();
    for (const value of values) {
      await this.page.getByRole("option", { name: value, exact: true }).click();
    }
    await this.page.keyboard.press("Escape");
  }

  async choose(select, label) {
    await select.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  async openViewMenu() {
    if (await this.createViewButton.first().isVisible()) return;
    await this.viewMenu.click();
    await this.createViewButton
      .first()
      .waitFor({ timeout: scaleTimeout(15000) });
  }

  // --------------------------------------
  // Kanban
  // --------------------------------------

  /** A phase column: its label span and the cards under it share one full-height div. */
  kanbanColumn(phase) {
    return this.page
      .locator("div.min-h-screen")
      .filter({ has: this.page.getByText(phase, { exact: true }) })
      .last();
  }

  /** A project's card on the board; it is a role="link" div. */
  card(name) {
    return this.page.getByRole("link").filter({ hasText: name }).first();
  }

  /** Drags a card into a phase column, dropping just under the column's heading. */
  async dragCard(name, phase) {
    const from = await this.card(name).boundingBox();
    const heading = await this.kanbanColumn(phase)
      .getByText(phase, { exact: true })
      .boundingBox();
    const [x, y] = [from.x + from.width / 2, from.y + 20];
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    // A small first move passes dnd-kit's activation distance.
    await this.page.mouse.move(x + 10, y + 10, { steps: 3 });
    await this.page.waitForTimeout(300);
    const [tx, ty] = [heading.x + heading.width / 2, heading.y + 60];
    await this.page.mouse.move(tx, ty, { steps: 25 });
    // The board regroups on drag-over; let it settle on the target before dropping.
    await this.page.mouse.move(tx, ty + 5, { steps: 3 });
    await this.page.waitForTimeout(500);
    await this.page.mouse.up();
  }

  /** Fills Add Project: name, company and customer by their placeholders. */
  async fillAddProject({ name, company, customer }) {
    const dialog = this.addProjectDialog;
    await dialog.getByPlaceholder("Project Name").fill(name);
    for (const [placeholder, value] of [
      ["Select company", company],
      ["Select customer", customer],
    ]) {
      await dialog.getByPlaceholder(placeholder).click();
      await dialog.getByPlaceholder(placeholder).fill(value);
      await this.page.getByRole("option", { name: value, exact: true }).click();
    }
  }

  /** Runs a saved view's row action: Duplicate, Edit, Make Public, Make Private or Delete. */
  async viewAction(viewName, action) {
    await this.getViewRowActions(viewName);
    await this.page
      .getByRole("menuitem", { name: action, exact: true })
      .click();
  }

  /** The label the view menu button shows for the open view. */
  async openViewLabel() {
    return (await this.page.getByRole("banner").innerText()).replace(
      /\s+/g,
      " ",
    );
  }

  /** The "x" beside Filter clears everything; with the panel open its click only closes the panel. */
  async clearAll() {
    for (let step = 0; step < 3; step++) {
      if (!(await this.filterFieldInput.first().isVisible())) break;
      await this.page.keyboard.press("Escape");
    }
    await this.clearAllFiltersButton.click();
  }

  /** The number on the Filter button, 0 when it shows none. */
  async filterCount() {
    const text = await this.filterButton.innerText();
    return Number(text.replace(/\D/g, "") || 0);
  }

  /** The visible column headers, left to right. */
  async headers() {
    return (await this.page.getByRole("columnheader").allInnerTexts()).map(
      (label) => label.trim(),
    );
  }

  columnOptions(label) {
    return this.page.getByRole("button", {
      name: `${label} column options`,
      exact: true,
    });
  }

  async pinColumn(label) {
    await this.columnOptions(label).click();
    const item = this.page.getByRole("menuitem", { name: "Pin column" });
    await item.click();
    return item;
  }

  sortState(label) {
    return this.columnHeader(label).getAttribute("aria-sort");
  }
}
