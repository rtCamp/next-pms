import { expect } from "@playwright/test";
import { gotoWithRetry } from "../utils/navigation.js";
import { scaleTimeout } from "../utils/timeouts";

/**
 * The Growth tab of a project, and the detail view an initiative opens in.
 */
export class GrowthPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    this.growthTab = page.getByRole("tab", { name: "Growth" }).first();
    this.createButton = page.getByRole("button", {
      name: "Create",
      exact: true,
    });
    this.openHeading = page.getByRole("heading", {
      name: /^Open Growth Initiatives/,
    });
    this.closedHeading = page.getByRole("heading", {
      name: /^Closed Growth Initiatives/,
    });

    // Create, edit and update all open in the last dialog on the page.
    this.dialog = page.getByRole("dialog").last();
    this.activityInput = this.dialog.getByPlaceholder("Enter activity");

    this.backButton = page.getByRole("button", {
      name: "Back to growth initiatives",
    });
    this.addUpdateButton = page.getByRole("button", { name: "Add update" });
    this.addDocumentButton = page.getByRole("button", {
      name: "Add document",
    });

    // The toolbar filters are comboboxes labelled by their text, not buttons.
    this.statusFilter = page
      .getByRole("combobox")
      .filter({ hasText: "Status" });

    this.toast = (text) =>
      page.getByRole("region", { name: /notification/i }).getByText(text);
  }

  // --------------------------------------
  // Navigation
  // --------------------------------------

  /** `canCreate: false` for a user who is not offered Create, so the list is what loads. */
  async goto(projectId, { canCreate = true } = {}) {
    await gotoWithRetry(
      this.page,
      `/next-pms/projects/${projectId}?tab=growth`,
    );
    await (canCreate ? this.createButton : this.openHeading).waitFor({
      state: "visible",
      timeout: scaleTimeout(30000),
    });
  }

  // --------------------------------------
  // List
  // --------------------------------------

  /** The initiative's name in the list. */
  item(activity) {
    return this.page.getByText(activity, { exact: true }).first();
  }

  row(activity) {
    return this.item(activity).locator(
      "xpath=ancestor::div[contains(@class,'border-b')][1]",
    );
  }

  /** The number in the "Open Growth Initiatives N" heading. */
  async openCount() {
    return this.count(this.openHeading);
  }

  async closedCount() {
    return this.count(this.closedHeading);
  }

  async count(heading) {
    const text = await heading.first().innerText();

    return Number(text.replace(/\D+/g, ""));
  }

  /** The Closed list can start collapsed; expand it only when it is. */
  async expandClosed() {
    const toggle = this.page.getByRole("button", {
      name: /^Closed Growth Initiatives/,
    });
    if ((await toggle.first().getAttribute("aria-expanded")) === "false") {
      await toggle.first().click();
    }
  }

  async openRowMenu(activity) {
    await this.row(activity).getByRole("button").last().click();
  }

  async openDetail(activity) {
    await this.item(activity).click();
    await this.backButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(15000),
    });
  }

  async backToList() {
    await this.backButton.click();
    await this.createButton.waitFor({
      state: "visible",
      timeout: scaleTimeout(15000),
    });
  }

  // --------------------------------------
  // Dialog fields
  // --------------------------------------

  field(label) {
    return this.dialog
      .locator("label")
      .filter({ hasText: new RegExp(`^${label}`) })
      .locator("xpath=..");
  }

  /** User fields list everyone; search first, then match the trailing full name. */
  async chooseUser(label, fullName) {
    await this.field(label).getByRole("combobox").fill(fullName);
    await this.page
      .getByRole("option", { name: new RegExp(`${fullName}$`) })
      .first()
      .click();
  }

  async choose(label, option) {
    const field = this.field(label);
    await field
      .getByRole("combobox")
      .or(field.getByRole("button"))
      .first()
      .click();
    await this.page.getByRole("option", { name: option, exact: true }).click();
  }

  async filterByStatus(status) {
    await this.statusFilter.click();
    await this.page.getByRole("option", { name: status, exact: true }).click();
    await this.page.keyboard.press("Escape");
  }

  // --------------------------------------
  // Create / edit / update
  // --------------------------------------

  async create({ activity, status = "Ideation", description }) {
    await this.createButton.click();
    await this.activityInput.fill(activity);
    if (description) {
      await this.field("Description")
        .locator("[contenteditable]")
        .first()
        .fill(description);
    }
    await this.choose("Status", status);
    await this.dialog
      .getByRole("button", { name: "Save", exact: true })
      .click();
  }

  async edit(activity, { newActivity }) {
    await this.openRowMenu(activity);
    await this.page.getByRole("menuitem", { name: "Edit" }).click();
    await this.activityInput.fill(newActivity);
    await this.dialog
      .getByRole("button", { name: "Save", exact: true })
      .click();
  }

  /** Posts an update from the detail view; leave a field out to keep it as is. */
  async addUpdate({ status, closedStatus, priority, note }) {
    await this.addUpdateButton.click();
    if (status) await this.choose("Status", status);
    if (closedStatus) await this.choose("Closed status", closedStatus);
    if (priority) await this.choose("Priority for Client", priority);
    if (note) {
      await this.field("Note").locator("[contenteditable]").first().fill(note);
    }
    await this.dialog.getByRole("button", { name: "Add update" }).click();
  }

  // --------------------------------------
  // Detail view
  // --------------------------------------

  /** The icon menu beside "Back": Follow / Unfollow, Edit, Delete. */
  async openDetailMenu() {
    await this.backButton
      .locator("xpath=../..")
      .locator("button")
      .nth(1)
      .click();
  }

  async deleteFromList(activity) {
    await this.openRowMenu(activity);
    await this.page.getByRole("menuitem", { name: "Delete" }).click();
    const confirm = this.page
      .getByRole("dialog")
      .getByRole("button", { name: /^(Delete|Confirm|Yes)/ });
    if (
      await confirm
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await confirm.first().click();
    }
  }

  section(name) {
    return this.page
      .getByRole("heading", { name, exact: true })
      .locator("xpath=../..");
  }

  /** Takes {path} for a file on disk, or {name, mimeType, content} for a generated one. */
  async uploadDocument(file) {
    const [chooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      this.addDocumentButton.click(),
    ]);
    await chooser.setFiles(
      file.path
        ? file.path
        : {
            name: file.name,
            mimeType: file.mimeType,
            buffer: Buffer.from(file.content),
          },
    );
  }

  /** A listed document renders as "<name without extension> <TYPE> · <size>". */
  documentLink(fileName) {
    const base = fileName.replace(/\.[^.]+$/, "");

    return this.page.getByRole("link", {
      name: new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    });
  }

  /** True when the file shows up in the list; false if it never does. */
  async isDocumentListed(fileName, timeout = scaleTimeout(8000)) {
    return this.documentLink(fileName)
      .first()
      .waitFor({ state: "visible", timeout })
      .then(
        () => true,
        () => false,
      );
  }

  async expectDocumentCount(fileName, count) {
    await expect(this.documentLink(fileName)).toHaveCount(count);
  }
}
