import { gotoWithRetry } from "../utils/navigation.js";
import { scaleTimeout } from "../utils/timeouts";

/**
 * The ToDos of a project: the ToDos tab, the Add / Edit ToDo dialog, the ToDos
 * column of the Calendar list view and the Action items of a growth initiative.
 */
export class TodoPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    this.newTodoButton = page.getByRole("button", { name: "New ToDo" });
    this.emptyMessage = page.getByText("No ToDos yet for this project.");

    // Unlink and delete confirmations open in the last dialog on the page.
    this.dialog = page.getByRole("dialog").last();

    // The Add / Edit form is found by name: a toast is a dialog too, and sits
    // after the form in the page while it is on screen.
    this.form = page.getByRole("dialog", { name: /^(Add|Edit) ToDo$/ });
    this.createButton = this.form.getByRole("button", {
      name: "Create",
      exact: true,
    });
    this.saveButton = this.form.getByRole("button", {
      name: "Save",
      exact: true,
    });
    this.editor = this.form.locator(".ProseMirror");
    // Title, Start and End are custom fields, so only sites that have them show them.
    this.titleInput = this.form.getByPlaceholder("Add a title");
    // A picker shows its placeholder until a day is picked, then the date.
    this.dateTriggers = this.form
      .locator("button")
      .filter({ hasText: /^(Start|End|\d{4}-\d{2}-\d{2} \d{2}:\d{2} [ap]m)$/ });
    this.startTrigger = this.dateTriggers.nth(0);
    this.endTrigger = this.dateTriggers.nth(1);
    // The status and priority selects are comboboxes labelled by their value.
    this.statusSelect = this.form
      .getByRole("combobox")
      .filter({ hasText: /^(Open|Backlog|In Progress|Closed|Cancelled)$/ });
    this.prioritySelect = this.form
      .getByRole("combobox")
      .filter({ hasText: /^(Low|Medium|High)$/ });
    this.assigneeInput = this.form.getByPlaceholder("Assignee");
    this.linkInput = this.form.getByPlaceholder(/^Link to milestone/);
    this.clearLinkButton = this.form.getByRole("button", {
      name: "Clear selection",
    });
    this.fieldError = (text) => this.form.getByText(text, { exact: true });

    this.actionItems = page
      .getByRole("heading", { name: "Action items" })
      .locator("xpath=ancestor::section[1]");
    this.addActionItemButton = this.actionItems.getByRole("button", {
      name: "Add ToDo",
    });

    // `.first()`: a previous toast with the same text can still be on screen.
    this.toast = (text) =>
      page
        .getByRole("region", { name: /notification/i })
        .getByText(text)
        .first();
  }

  // --------------------------------------
  // Navigation
  // --------------------------------------

  async gotoTodos(projectId) {
    await gotoWithRetry(this.page, `/next-pms/projects/${projectId}?tab=to-do`);
    await this.newTodoButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(30000),
    });
  }

  /** `type` is "milestones" or "touchpoints". */
  async gotoCalendarList(projectId, type) {
    await gotoWithRetry(
      this.page,
      `/next-pms/projects/${projectId}?tab=calendar&view=list&type=${type}`,
    );
    await this.page
      .getByRole("columnheader", { name: "ToDos" })
      .waitFor({ state: "visible", timeout: scaleTimeout(30000) });
  }

  async gotoCalendarGrid(projectId) {
    await gotoWithRetry(
      this.page,
      `/next-pms/projects/${projectId}?tab=calendar`,
    );
    await this.page
      .getByRole("button", { name: "Today" })
      .waitFor({ state: "visible", timeout: scaleTimeout(30000) });
  }

  // --------------------------------------
  // Add / edit dialog
  // --------------------------------------

  async openNewTodo() {
    await this.newTodoButton.click();
    await this.createButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(15000),
    });
  }

  /**
   * Fills the open dialog. The description defaults to `title`, so the row is
   * found by it whether or not the site has the Title custom field. Start and
   * End are days of the current month; they are picked only where the site has
   * those fields.
   */
  async fillTodo({
    title,
    description,
    status,
    priority,
    assignee,
    linkTo,
    startDay = 15,
    endDay = 20,
  }) {
    await this.form
      .getByRole("button", { name: /^(Create|Save)$/ })
      .waitFor({ state: "visible", timeout: scaleTimeout(15000) });

    const hasCustomFields = (await this.titleInput.count()) > 0;
    if (hasCustomFields) await this.titleInput.fill(title);
    await this.writeDescription(description ?? title);
    if (status) await this.setStatus(status);
    if (priority) await this.setPriority(priority);
    if (assignee) await this.chooseAssignee(assignee);
    if (hasCustomFields) {
      await this.pickDate(this.startTrigger, startDay);
      await this.pickDate(this.endTrigger, endDay);
    }
    if (linkTo) await this.chooseLink(linkTo);
  }

  async writeDescription(text) {
    await this.editor.click();
    await this.page.keyboard.type(text);
  }

  async appendToDescription(text) {
    await this.editor.click();
    await this.page.keyboard.press("ControlOrMeta+End");
    await this.page.keyboard.type(text);
  }

  async setStatus(status) {
    await this.statusSelect.click();
    // The options are plain text in a popup, not role=option.
    await this.page.getByText(status, { exact: true }).last().click();
  }

  async setPriority(priority) {
    await this.prioritySelect.click();
    await this.page.getByText(priority, { exact: true }).last().click();
  }

  /** Clicking a day sets the value and closes the picker; the time stays 12:00 am. */
  async pickDate(trigger, day) {
    await trigger.click();
    // The day buttons are missing from the accessibility tree while the dialog is open.
    await this.page
      .locator("button")
      .filter({ hasText: new RegExp(`^${day}$`) })
      .first()
      .click();
  }

  /** Searches the users by name and picks the first match. */
  async chooseAssignee(fullName) {
    await this.assigneeInput.click();
    await this.assigneeInput.fill(fullName);
    await this.page
      .getByRole("option")
      .filter({ hasText: fullName })
      .first()
      .click();
  }

  async chooseLink(title) {
    await this.linkInput.click();
    await this.page.getByRole("option", { name: title, exact: true }).click();
  }

  async createTodo(fields) {
    await this.fillTodo(fields);
    await this.createButton.click();
  }

  // --------------------------------------
  // ToDo rows (ToDos tab, popovers and Action items share them)
  // --------------------------------------

  row(title) {
    return this.page
      .getByRole("heading", { name: title, exact: true })
      .locator("xpath=ancestor::div[contains(@class,'border-b')][1]");
  }

  /** The chip that names the milestone, touchpoint or initiative a ToDo is linked to. */
  linkedChip(title) {
    return this.row(title).getByRole("button", { name: /^Open / });
  }

  doneButton(title) {
    return this.row(title).getByRole("button", { name: "Mark as done" });
  }

  reopenButton(title) {
    return this.row(title).getByRole("button", { name: "Reopen" });
  }

  /** The link to the assignee's Desk profile; the row prints no email. */
  assigneeLink(title) {
    return this.row(title).locator("a[href*='/desk/user/']");
  }

  menuItems() {
    return this.page.getByRole("menuitem");
  }

  async openRowMenu(title) {
    await this.row(title).getByRole("button", { name: "ToDo actions" }).click();
  }

  async chooseRowAction(title, action) {
    await this.openRowMenu(title);
    await this.menuItems().filter({ hasText: action }).click();
  }

  async openEdit(title) {
    await this.chooseRowAction(title, "Edit");
    await this.saveButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(15000),
    });
  }

  /** Confirms or cancels the open unlink / delete dialog. */
  async answerDialog(label) {
    await this.dialog.getByRole("button", { name: label, exact: true }).click();
  }

  // --------------------------------------
  // Calendar list view
  // --------------------------------------

  listRow(title) {
    return this.page.getByRole("row").filter({
      has: this.page.getByRole("button", { name: title, exact: true }),
    });
  }

  /** The "N ToDos linked" button; it appears once the row's links have loaded. */
  todosCell(title) {
    return this.listRow(title).getByRole("button", {
      name: /^\d+ ToDos? linked$/,
    });
  }

  addTodoButton(title) {
    return this.page.getByRole("button", {
      name: `Add ToDo to ${title}`,
      exact: true,
    });
  }

  /** The hover card listing a row's linked ToDos. */
  popover(title) {
    return this.page
      .getByText(`ToDos · ${title}`)
      .locator("xpath=ancestor::div[contains(@class,'shadow-2xl')][1]");
  }

  /** The Add ToDo button inside that hover card. */
  popoverAddButton(title) {
    return this.popover(title).getByRole("button", {
      name: "Add ToDo",
      exact: true,
    });
  }

  /** The row's actions button has no accessible name, so it is the row's last button. */
  async chooseListAction(title, action) {
    await this.listRow(title).getByRole("button").last().click();
    await this.menuItems().filter({ hasText: action }).click();
  }

  // --------------------------------------
  // Calendar grid
  // --------------------------------------

  /** The pill a milestone or touchpoint is drawn as; its title is plain text. */
  gridPill(title) {
    return this.page.getByText(title, { exact: true }).first();
  }

  /** The card that opens when a pill is hovered. */
  gridCard(title) {
    return this.page
      .locator("div.shadow-2xl")
      .filter({ hasText: title })
      .last();
  }
}
