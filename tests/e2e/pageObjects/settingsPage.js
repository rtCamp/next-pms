import { expect } from "allure-playwright";
import { gotoWithRetry } from "../utils/navigation";
import { escapeRegExp } from "../utils/stringUtils";
import { scaleTimeout } from "../utils/timeouts";

/**
 * The Settings dialog, opened from the Next PMS menu in the sidebar header. A section
 * ("User Configuration", "System Configuration") is a labelled nav of tab buttons.
 * Checkboxes and fields carry no accessible label of their own, so they are found from
 * the text beside them.
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

  section(label) {
    return this.dialog.getByRole("navigation", { name: label });
  }

  tab(sectionLabel, name) {
    return this.section(sectionLabel).getByRole("button", {
      name,
      exact: true,
    });
  }

  async openTab(sectionLabel, name) {
    await this.tab(sectionLabel, name).click();
    await expect(this.tab(sectionLabel, name)).toHaveAttribute("aria-current", "page");
  }

  async save() {
    await this.saveButton.click();
  }

  // --------------------------------------
  // Fields
  // --------------------------------------

  /** A checkbox, found by the label printed beside it. */
  checkbox(label) {
    return this.dialog
      .locator('div:has(> input[type="checkbox"])')
      .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`) })
      .getByRole("checkbox");
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
