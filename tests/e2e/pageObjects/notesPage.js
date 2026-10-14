import { gotoWithRetry } from "../utils/navigation.js";
import { scaleTimeout } from "../utils/timeouts";

/**
 * The Notes tab of a project: the note list, the note and template editors,
 * the subscribe button and the comments on a note.
 */
export class NotesPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    this.createButton = page.getByRole("button", {
      name: "Create",
      exact: true,
    });
    this.noteTitleInput = page.getByPlaceholder("Note title");
    this.templateTitleInput = page.getByRole("textbox", {
      name: "Template title",
    });
    this.saveNoteButton = page.getByRole("button", { name: "Save note" });
    this.saveTemplateButton = page
      .getByRole("button", { name: "Save template" })
      .first();
    this.editor = page.locator(".ProseMirror").first();
    this.dialog = page.getByRole("dialog").last();

    this.commentInput = page
      .getByRole("textbox", { name: "Type a comment" })
      .first();
    // The comment box becomes a rich editor once it is clicked.
    this.commentEditor = page.locator("[contenteditable=true]").last();
    this.postButton = page.getByRole("button", { name: "Post", exact: true });

    this.subscriptionButton = (label) =>
      page.getByRole("button", { name: label, exact: true });
    this.toast = (text) =>
      page.getByRole("region", { name: /notification/i }).getByText(text);
  }

  // --------------------------------------
  // Navigation
  // --------------------------------------

  async goto(projectId) {
    await gotoWithRetry(this.page, `/next-pms/projects/${projectId}?tab=notes`);
    await this.createButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(30000),
    });
  }

  async gotoNote(projectId, noteId) {
    await gotoWithRetry(
      this.page,
      `/next-pms/projects/${projectId}?tab=notes&note=${noteId}`,
    );
    await this.commentInput.waitFor({
      state: "visible",
      timeout: scaleTimeout(30000),
    });
  }

  async gotoTemplateEdit(projectId, templateName) {
    await gotoWithRetry(
      this.page,
      `/next-pms/projects/${projectId}/notes/templates/${encodeURIComponent(templateName)}/edit`,
    );
    await this.templateTitleInput.waitFor({
      state: "visible",
      timeout: scaleTimeout(30000),
    });
  }

  // --------------------------------------
  // Notes
  // --------------------------------------

  /** The note's title in the list. */
  card(title) {
    return this.page.getByText(title, { exact: true }).first();
  }

  async openCardMenu(title, item) {
    await this.card(title)
      .locator("xpath=ancestor::*[contains(@class,'border')][1]")
      .getByRole("button")
      .first()
      .click();
    await this.page.getByRole("menuitem", { name: item }).click();
  }

  async writeBody(text, { replace = false } = {}) {
    await this.editor.click();
    if (replace) await this.page.keyboard.press("ControlOrMeta+a");
    await this.page.keyboard.type(text);
  }

  /** Saving a note publishes it. */
  async createNote({ title, body }) {
    await this.createButton.click();
    await this.page.getByRole("menuitem", { name: "New blank note" }).click();
    await this.noteTitleInput.fill(title);
    await this.writeBody(body);
    await this.saveNoteButton.click();
  }

  async editNote(title, { newTitle, newBody }) {
    await this.openCardMenu(title, "Edit");
    await this.noteTitleInput.waitFor({
      state: "visible",
      timeout: scaleTimeout(15000),
    });
    await this.noteTitleInput.fill(newTitle);
    await this.writeBody(newBody, { replace: true });
    await this.saveNoteButton.click();
  }

  // --------------------------------------
  // Templates
  // --------------------------------------

  async createTemplate({ title, body }) {
    await this.createButton.click();
    await this.page.getByRole("menuitem", { name: "Create template" }).click();
    await this.templateTitleInput.fill(title);
    await this.writeBody(body);
    await this.saveTemplateButton.click();
    await this.dialog.getByRole("button", { name: "Save template" }).click();
  }

  /** Appends text to an open template and saves it through the Edit dialog. */
  async appendToTemplate(text) {
    await this.editor.click();
    await this.page.keyboard.press("ControlOrMeta+End");
    await this.page.keyboard.type(text);
    await this.saveTemplateButton.click();
    await this.dialog.getByRole("button", { name: "Save changes" }).click();
  }

  // --------------------------------------
  // Comments
  // --------------------------------------

  /**
   * Posts a comment that mentions a user. The list opens on "@" plus the first
   * word of the name; a space would end the search.
   */
  async commentWithMention({ mention, text }) {
    await this.commentInput.click();
    await this.commentEditor.click();
    await this.page.keyboard.type(`@${mention.split(" ")[0]}`);
    await this.page.getByText(mention, { exact: true }).first().click();
    await this.page.keyboard.type(` ${text}`);
    await this.postButton.click();
  }

  async comment(text) {
    await this.commentInput.click();
    await this.commentEditor.click();
    await this.page.keyboard.type(text);
    await this.postButton.click();
  }
}
