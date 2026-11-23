import { expect } from "allure-playwright";
import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";

/**
 * The Settings dialog, opened from the Next PMS menu in the sidebar header. Its sidebar is
 * one tablist; a section ("User Configuration", "System Configuration") is a group of tabs
 * under a plain-text label, with no role or accessible name of its own.
 */
export class SettingsPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.headerMenu = page.getByRole("button", { name: /Next PMS/ }).first();
    this.dialog = page.getByRole("dialog", { name: "Settings" });
    this.saveButton = this.dialog.getByRole("button", {
      name: "Save",
      exact: true,
    });
    // The personal Timesheets tab has one number box and one checkbox.
    this.weeksInput = this.dialog.getByRole("spinbutton");
    this.useSystemDefault = this.checkbox("Use system default");
    this.toast = (text) =>
      page
        .getByRole("region", { name: /notification/i })
        .getByText(text)
        .first();
  }

  // --------------------------------------
  // Open and navigate
  // --------------------------------------

  /** Any page that shows the sidebar will do; the Timesheet is open to every role. */
  async goto(path = "/next-pms/timesheet") {
    await gotoWithRetry(this.page, path);
    await this.headerMenu.waitFor({ timeout: scaleTimeout(40000) });
  }

  async open() {
    await this.headerMenu.click();
    await this.page.getByRole("menuitem", { name: "Settings" }).click();
    await this.dialog.waitFor({ timeout: scaleTimeout(15000) });
  }

  /** The sections of the sidebar: each is its label followed by its tabs. */
  get sections() {
    return this.dialog.getByRole("tablist").locator("xpath=./div/div");
  }

  section(label) {
    return this.sections.filter({
      has: this.page.getByText(label, { exact: true }),
    });
  }

  tabs(sectionLabel) {
    return this.section(sectionLabel).getByRole("tab");
  }

  tab(sectionLabel, name) {
    return this.section(sectionLabel).getByRole("tab", {
      name,
      exact: true,
    });
  }

  async openTab(sectionLabel, name) {
    await this.tab(sectionLabel, name).click();
    await expect(this.tab(sectionLabel, name)).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }

  async save() {
    await this.saveButton.click();
  }

  // --------------------------------------
  // Fields
  // --------------------------------------

  checkbox(label) {
    return this.dialog.getByRole("checkbox", { name: label, exact: true });
  }

  /** The text that names a field; it is on the page only while the field is. */
  label(text) {
    return this.dialog.getByText(text, { exact: true });
  }

  /** The first input after a field's label: a number box. */
  numberField(label) {
    return this.label(label).locator("xpath=following::input[1]");
  }
}
