const escapeForRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Drives the "Columns" dialog on the Projects and Tasks list views.
 *
 * The layout is stored per user in PMS View Setting, so it carries over between
 * runs - every method here is written to be safe to call on either state.
 */
export class ColumnSettings {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;
    this.columnsButton = page.getByRole("button", { name: "Columns" }).first();

    // Other panels on these pages are dialogs too; the column list is the one
    // offering "Add Column".
    this.panel = page
      .getByRole("dialog")
      .filter({ hasText: "Add Column" })
      .first();
    this.addColumnButton = this.panel.getByText("Add Column", { exact: true });
  }

  /**
   * A header's accessible name repeats its label ("Project type Project type
   * column options"), so anchor the start and stop at a word boundary.
   */
  header(name) {
    return this.page.getByRole("columnheader", {
      name: new RegExp(`^${escapeForRegExp(name)}\\b`, "i"),
    });
  }

  async isColumnVisible(name) {
    return (await this.header(name).count()) > 0;
  }

  async open() {
    await this.columnsButton.click();
    await this.panel
      .getByRole("listitem")
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  }

  async close() {
    await this.page.keyboard.press("Escape");
    await this.panel
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  }

  /** Lists the columns currently in the layout, in display order. */
  async listColumns() {
    await this.open();
    const names = await this.panel.getByRole("listitem").allTextContents();
    await this.close();

    return names.map((n) => n.replace(/\s+/g, " ").trim());
  }

  async addColumn(name) {
    await this.open();
    await this.addColumnButton.click();

    // The picker opens as a second dialog over the panel.
    const option = this.page
      .getByRole("dialog")
      .last()
      .getByRole("option", { name, exact: true });

    await option.waitFor({ state: "visible", timeout: 15000 }).catch(() => {
      throw new Error(`"${name}" is not offered in the Add Column picker.`);
    });
    await option.click();

    await this.header(name)
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
    await this.close();
  }

  async removeColumn(name) {
    await this.open();
    await this.panel
      .getByRole("button", { name: `Remove column: ${name}` })
      .click();
    await this.header(name)
      .first()
      .waitFor({ state: "hidden", timeout: 15000 })
      .catch(() => {});
    await this.close();
  }

  /**
   * Adds the column only when it is missing, and reports whether it did.
   * Pass that result to removeColumn in cleanup to leave the layout as found.
   */
  async ensureColumnVisible(name) {
    if (await this.isColumnVisible(name)) return false;

    await this.addColumn(name);

    return true;
  }
}
