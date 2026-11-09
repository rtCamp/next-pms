import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";

/**
 * A project's page: the tab strip, the Overview tab and the "About this project"
 * sidebar with its Members and Customers.
 */
export class ProjectDetailsPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.overviewHeading = page.getByRole("heading", { name: "Overview" });
    this.editButton = page.getByRole("button", { name: "Edit", exact: true });
    this.saveButton = page.getByRole("button", { name: "Save", exact: true });
    this.cancelButton = page.getByRole("button", {
      name: "Cancel",
      exact: true,
    });
    this.openInDesk = page.getByRole("button", { name: "Open in Desk" });
    this.addMemberButton = page.getByRole("button", { name: "Add member" });
    this.addCustomerButton = page.getByRole("button", { name: "Add customer" });
    this.membersDialog = page.getByRole("dialog", { name: "Add members" });
    this.customersDialog = page.getByRole("dialog", { name: "Add customers" });
    this.repoDialog = page.getByRole("dialog", {
      name: "Connect a GitHub repository",
    });
    this.repoSection = page
      .locator("div")
      .filter({
        has: page.getByRole("heading", {
          name: "Project repository connections",
        }),
      })
      .filter({ has: page.getByText("Repository name", { exact: true }) })
      .last();
    // The sidebar's Project Manager and Lead Engineer comboboxes read "N/A" when empty.
    this.projectManager = page.getByRole("combobox").nth(0);
    this.leadEngineer = page.getByRole("combobox").nth(1);
  }

  async goto(projectId, tab) {
    await gotoWithRetry(
      this.page,
      `/next-pms/projects/${projectId}${tab ? `?tab=${tab}` : ""}`,
    );
    await this.tab("Overview").waitFor({ timeout: scaleTimeout(30000) });
  }

  tab(label) {
    return this.page.getByRole("tab", { name: label, exact: true });
  }

  async selectedTab() {
    return this.page.getByRole("tab", { selected: true }).innerText();
  }

  /** A boot flag the page reads to show its optional tabs. */
  boot(flag) {
    return this.page.evaluate((name) => !!window.frappe?.boot?.[name], flag);
  }

  /** An Overview field's editor while editing: the combobox after its label. */
  overviewField(label) {
    return this.page
      .getByText(label, { exact: true })
      .locator("xpath=following::*[@role='combobox'][1]");
  }

  /** The Details rich-text editor, the first one on the Overview tab. */
  get detailsEditor() {
    return this.page.locator("[contenteditable=true]").first();
  }

  async choose(combobox, option) {
    await combobox.click();
    await this.page.getByRole("option", { name: option, exact: true }).click();
  }

  /** A sidebar combobox opens on focus and filters as you type. */
  async pickPerson(combobox, name) {
    await combobox.click();
    await this.page.keyboard.type(name);
    await this.page.getByRole("option", { name }).first().click();
  }

  /** Clicks Add or Remove on the one row the dialog's search narrows to. */
  async toggleInDialog(dialog, search, name, action) {
    await dialog.getByRole("textbox").first().fill(search);
    await dialog.getByText(name).first().waitFor();
    await dialog
      .getByRole("button", { name: action, exact: true })
      .first()
      .click();
  }
}
