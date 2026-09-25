import { expect } from "allure-playwright";
import path from "path";
import { readJSONFile } from "../utils/fileUtils.js";
import { gotoWithRetry } from "../utils/navigation.js";

// Filter keys mapped to the labels the filter panel's "Field" dropdown offers.
const FILTER_FIELD_LABELS = {
  projectType: "Project Type",
  businessUnit: "Business Unit",
  billingType: "Billing type",
  customer: "Customer",
  projectManager: "Project Manager",
};

const exactly = (text) =>
  new RegExp(`^${String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

// The endpoint every project-list read ultimately waits on. Mirrors
// PROJECTS_VIEW_METHOD in frontend/packages/app/src/pages/projects/constants.ts.
const PROJECTS_VIEW_METHOD =
  "next_pms.next_projects.api.project.get_projects_view";

export class ProjectPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    //Search bar on project page
    this.searchBar = page.getByRole("textbox", { name: "Search project" });
    //List of projects displayed in the project table
    // Scoped to project links only - the Project manager / Lead engineer cells
    // also render links (to /desk/user/<email>) inside the same table.
    this.projectListItems = page
      .getByRole("table", { name: "Projects" })
      .locator('a[href^="/next-pms/projects/"]');

    //Filter panel - a query-builder: "Where <Field> <Operator> <Value>"
    this.filterButton = page.getByRole("button", { name: "Filter" }).first();
    this.clearAllFiltersButton = page.getByRole("button", {
      name: "Clear all filters",
    });
    this.addFilterButton = page.getByText("Add filter");
    this.filterFieldInput = page.getByPlaceholder("Field");
    this.filterOperatorInput = page.getByPlaceholder("Operator");
    this.filterValueInput = page.getByPlaceholder("Value");

    //Currency has its own combobox, outside the query-builder
    this.currencySearchBar = page.getByPlaceholder("Currency");

    //Select filter option
    this.selectFilterOption = (filterOption) =>
      page.getByRole("option", { name: `${filterOption}` });

    //Sort by Button
    this.sortByButton = (buttonText) =>
      page.locator(`//button[text()="${buttonText}"]`);

    // Sorting now sits behind a single "Sort" button whose panel lists the
    // sortable fields; the button's own label grows to "Sort <field>" once one
    // is active. Picking the same field again flips the direction, and nothing
    // in the DOM indicates which way it went - callers read the resulting order.
    this.sortButton = page.getByRole("button", { name: /^Sort/ }).first();
    this.sortPanel = page.getByRole("dialog");

    //Columns Button
    this.columnsButton = page.getByRole("button", { name: "Columns" });

    // Locator for the empty state. The list has no cell roles any more and the
    // wording changed from "No results" to "No projects found."
    this.noResultsCell = page.getByText(/no projects found/i);

    //More Actions
    this.moreActionsButton = page.getByRole("button", { name: "More Actions" });

    // Views moved out of separate "Public Views" / "Private Views" buttons into
    // one menu behind the active-view button, which is labelled "List view"
    // until a saved view is open and then shows that view's icon. The menu
    // lists the built-in views, every saved view, and "Create View".
    this.viewMenuButton = page
      .getByRole("button", { name: /^(List view|Kanban view|📋|📁)$/ })
      .first();
    this.viewMenuItem = (viewName) =>
      page.getByRole("menuitem").filter({ hasText: viewName }).first();

    //Create View
    this.createViewButton = page
      .getByRole("menuitem")
      .filter({ hasText: /^Create View$/ });
    this.viewNameInput = page.getByPlaceholder("View Name");
    this.createButton = page.getByRole("button", {
      name: "Create",
      exact: true,
    });
    // Views are private unless this is ticked in the create dialog.
    this.makeViewPublicCheckbox = page.getByText("Make this view public");

    // Per-view actions (Duplicate / Edit / Make Public / Delete) sit behind an
    // unlabelled menu button that only appears while its row is hovered.
    this.viewRowMenuButton = (viewName) =>
      page
        .getByRole("menuitem")
        .filter({ hasText: viewName })
        .first()
        .locator("button[aria-haspopup='menu']")
        .first();
    this.deleteViewButton = page
      .getByRole("menuitem")
      .filter({ hasText: /^Delete$/ });

    //Private Views
    this.privateViewsButton = page.getByRole("button", {
      name: "Private Views",
    });

    //Public views
    this.publicViewsButton = page.getByRole("button", { name: "Public Views" });

    this.gotoPublicView = (publicViewName) =>
      page.locator(`a[title="${publicViewName}"]`);

    //List of projects displayed in the Retainer public view
    this.projectListItemsInRetainerView = page.locator(
      "//table//tbody//tr//td[2]//p",
    );

    // Toasts render inside the notifications region, with the message split
    // across nested elements - match on text rather than an exact-text node.
    this.toastNotification = (notificationMessage) =>
      page
        .getByRole("region", { name: /notification/i })
        .getByText(notificationMessage);

    //Project table headers
    // Each header wraps a "<name> column options" button, so its accessible name
    // reads "Project name Project name column options". An anchored `^...$` can
    // never match that - hence `\\b` rather than `$`, which still keeps
    // "Project name" from matching the "Project type" header.
    this.projectTableHeader = (headerName) =>
      page.getByRole("columnheader", {
        name: new RegExp(
          `^${headerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "i",
        ),
      });

    //Project row locators
    this.projectRow = (projectName) =>
      page.getByRole("row").filter({
        has: page.getByRole("link", { name: projectName, exact: true }),
      });

    // The redesigned name cell sets no title attribute; it renders a link.
    this.projectNameCell = (projectName) =>
      page
        .getByRole("table", { name: "Projects" })
        .getByRole("link", { name: projectName, exact: true })
        .first();

    this.projectTypeCell = (projectName, projectType) =>
      this.projectRow(projectName)
        .getByRole("cell", { name: projectType, exact: true })
        .first();

    this.statusCell = (projectName, status) =>
      this.projectRow(projectName).locator(
        `xpath=.//td//div[normalize-space(text())="${status}"]`,
      );

    this.businessUnitCell = (projectName, businessUnit) =>
      this.projectRow(projectName).locator(
        `xpath=.//p[@title="${businessUnit}"]`,
      );

    this.billingTypeCell = (projectName, billingType) =>
      this.projectRow(projectName).locator(
        `xpath=.//td//div[normalize-space(text())="${billingType}"]`,
      );

    this.currencyCell = (projectName, currency) =>
      this.projectRow(projectName).locator(`xpath=.//p[@title="${currency}"]`);

    //Sort data in ascending order
    this.sortAscending = page.locator('section svg[class*="arrow-down-az"]');
    //Sort data in descending order
    this.sortDescending = page.locator('section svg[class*="arrow-down-za"]');
  }
  /**
   * Loads test data from a JSON file.
   * @param {string} jsonDir - Directory containing JSON files.
   * @param {string} fileName - Name of the JSON file to load.
   * @returns {Object} Parsed JSON data.
   */
  async loadTestData(jsonDir, fileName) {
    const stubPath = path.join(jsonDir, fileName);
    const data = await readJSONFile(stubPath);
    return data;
  }

  /**
   * Navigates to the project page and waits for it to fully load.
   */
  async goto() {
    await gotoWithRetry(this.page, "/next-pms/projects?status=Open");
  }

  /**
   * Perform a search using the search bar.
   * @param {string} query - The search query.
   */
  async searchProject(query) {
    await this.searchBar.fill(query);
    await this.searchBar.press("Enter"); // Simulate pressing Enter to trigger the search
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {}); // Wait for the search results to load
  }

  /**
   * Get the list of project names currently displayed.
   */
  /**
   * Applies a sort by field label. Calling it twice with the same field flips
   * the direction, which is the only way to change direction now that no
   * ascending/descending control is rendered.
   */
  async sortBy(fieldLabel) {
    await this.sortButton.click({ force: true });
    await this.page.waitForTimeout(1000);

    // The column headers carry the same labels as the panel's field list, so
    // scope to the open panel when there is one.
    const exactName = { name: fieldLabel, exact: true };
    const target = (await this.sortPanel.count())
      ? this.sortPanel.getByRole("button", exactName).first()
      : this.page.getByRole("button", exactName).first();

    await target.click({ force: true });
    await this.page.waitForTimeout(2500);
  }

  async getProjectList() {
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
    const projectNames = await this.projectListItems.allTextContents();
    const totalCount = projectNames.length;
    return { projectNames, totalCount };
  }

  /**
   * Check if the "No results" message is visible.
   * @returns {Promise<boolean>} - True if "No results" is visible, false otherwise.
   */
  async isNoResultsVisible() {
    // Report rather than assert, so the caller's own expectation produces the
    // failure message. Also confirm the grid really is empty: the empty-state
    // text alone could linger while rows are present.
    const emptyState = await this.noResultsCell
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const rowCount = await this.projectListItems.count();

    return emptyState && rowCount === 0;
  }

  /**
   * Apply all filters provided.
   *
   * Filtering goes through the panel's query-builder ("Where <Field> <Operator>
   * <Value>"). Conditions are always ANDed - the panel offers no OR and no
   * multi-value operator - so passing several values for one field narrows to
   * nothing rather than matching any of them.
   * @param {Object} filters - e.g. { projectType, businessUnit, billingType, customer, currency }
   */
  async applyFilters(filters) {
    let hasCondition = false;

    for (const [key, rawValue] of Object.entries(filters)) {
      if (!rawValue) continue;
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      if (values.length === 0) continue;

      // Currency sits outside the query-builder, in its own combobox.
      if (key === "currency") {
        await this.currencySearchBar.click();
        await this.currencySearchBar.fill(values[0]);
        const refetched = this.waitForProjectList();
        await this.page
          .getByRole("option", { name: exactly(values[0]) })
          .first()
          .click();
        await refetched;
        await this.page
          .waitForLoadState("networkidle", { timeout: 5000 })
          .catch(() => {});
        continue;
      }

      const fieldLabel = FILTER_FIELD_LABELS[key];
      if (!fieldLabel) {
        throw new Error(
          `Filter "${key}" is not selectable in the project filter panel. ` +
            `Available: ${Object.keys(FILTER_FIELD_LABELS).join(", ")}, currency.`,
        );
      }

      for (const value of values) {
        await this.addFilterCondition(fieldLabel, value, hasCondition);
        hasCondition = true;
      }
    }
  }

  /**
   * Adds a single "<Field> Equals <Value>" condition to the filter panel.
   */
  async addFilterCondition(fieldLabel, value, needsNewRow) {
    if (
      !(await this.filterFieldInput
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      // goto() only waits for domcontentloaded, so clicking straight away can
      // land while the list is still hydrating and the panel never opens. Wait
      // for the page to be interactive first, then give the panel time to
      // render. Do not click twice as a retry - the trigger toggles, so a second
      // click closes the panel the first one opened.
      await this.searchBar.waitFor({ state: "visible", timeout: 20000 });
      await this.page.waitForTimeout(1500);
      await this.filterButton.click();
      await this.filterFieldInput
        .first()
        .waitFor({ state: "visible", timeout: 20000 });
    }
    if (needsNewRow) {
      await this.addFilterButton.click();
    }

    // A new condition is appended, so its inputs are the last ones rendered.
    const field = this.filterFieldInput.last();
    await field.click();
    await field.fill(fieldLabel);
    await this.page
      .getByRole("option", { name: exactly(fieldLabel) })
      .first()
      .click();

    const operator = this.filterOperatorInput.last();
    await operator.click();
    await this.page
      .getByRole("option", { name: exactly("Equals") })
      .first()
      .click();

    const valueInput = this.filterValueInput.last();
    await valueInput.click();

    // Wait for the list the new condition produces before anything reads the
    // rows. networkidle alone is not a barrier here: the refetch is debounced,
    // so the page can be idle in the gap before the request even goes out. That
    // is how TC116 came to compare the pre-filter list against itself - the
    // failure screenshot shows the list spinner still turning. A repeat of a
    // query frappe-ui has already run is served from cache with no request at
    // all, so the wait gives up quietly rather than failing when none arrives.
    const refetched = this.waitForProjectList();

    await this.page
      .getByRole("option", { name: exactly(value) })
      .first()
      .click();

    await refetched;
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
  }

  /**
   * Resolves on the next project-list response, or quietly after a bounded wait
   * when the query is served from cache. Start it before the action that
   * triggers the refetch.
   */
  waitForProjectList() {
    return this.page
      .waitForResponse((resp) => resp.url().includes(PROJECTS_VIEW_METHOD), {
        timeout: 15000,
      })
      .catch(() => {});
  }

  /**
   * Clears every applied filter. The panel only exposes "Clear all filters", so
   * filters can no longer be cleared individually and any argument is ignored.
   */
  async clearFilters() {
    if (await this.clearAllFiltersButton.isVisible().catch(() => false)) {
      await this.clearAllFiltersButton.click();
      await this.page
        .waitForLoadState("networkidle", { timeout: 5000 })
        .catch(() => {});
    }
  }

  /**
   * Create a private view
   * @param {string} viewName - The name of the view to create.
   */
  async createPrivateView(viewName) {
    await this.openViewMenu();
    await this.createViewButton.click();
    await this.viewNameInput.fill(viewName);
    // Leave "Make this view public" unticked - that is what makes it private.
    await this.createButton.click();
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
    await this.page.waitForTimeout(2000);

    // Creating a view activates it (?view=<id>), and while a view is active the
    // menu trigger renders only its icon with no accessible name, so it cannot
    // be located. Navigating back to the plain project list clears the active
    // view, restoring the "List view" label - and it proves the view persisted
    // rather than only landing in local state.
    await this.goto();
    await this.page.waitForTimeout(3000);

    // The new view is listed as a menu item rather than a link.
    await this.openViewMenu();
    await expect(this.viewMenuItem(viewName)).toBeVisible({ timeout: 15000 });
  }

  /**
   * Opens the saved-views menu. The trigger is labelled "List view" until a
   * saved view is active, after which it shows that view's icon.
   */
  async openViewMenu() {
    if (
      await this.createViewButton
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }
    await this.viewMenuButton.click({ force: true });
    await this.createViewButton
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  }

  async closeViewMenu() {
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(600);
  }
  /**
   * Delete a view by its name.
   * @param {string} viewName - The name of the view to delete.
   */
  async deletePrivateView(viewName, notification) {
    // Start from the plain list so the menu trigger is labelled "List view";
    // with a view active it renders as a bare icon with no accessible name.
    if ((await this.viewMenuButton.count()) === 0) {
      await this.goto();
      await this.page.waitForTimeout(2500);
    }
    await this.openViewMenu();

    // Each view row carries its own actions menu (Duplicate / Edit /
    // Make Public / Delete) behind an unlabelled button that only renders while
    // the row is hovered, so hover before reaching for it.
    const row = this.viewMenuItem(viewName);
    await row.waitFor({ state: "visible", timeout: 15000 });
    await row.hover();
    await this.page.waitForTimeout(600);

    await this.viewRowMenuButton(viewName).click({ force: true });
    await this.deleteViewButton
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
    await this.deleteViewButton.first().click();
    await this.page.waitForTimeout(1500);

    // A confirmation step may follow; take it when it appears.
    const confirm = this.page
      .getByRole("button", { name: /^(Delete|Confirm|Yes)$/ })
      .first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }

    await expect(this.toastNotification(notification)).toBeVisible({
      timeout: 15000,
    });
  }
  /**
   * Create a project using the provided payload.
   * @param {Object} payload - The project data to create.
   */
  async createProject(payload) {
    await this.page
      .getByRole("button", { name: "Add project", exact: true })
      .click();
    await this.page.getByPlaceholder("Project Name").fill(payload.project_name);

    // Company is a required field in the redesigned dialog.
    if (payload.company) {
      const company = this.page.getByPlaceholder("Select company");
      await company.click();
      await company.fill(payload.company);
      await this.page
        .getByRole("option", { name: payload.company })
        .first()
        .click();
    }
    await this.page.getByRole("button", { name: "Add Project" }).click();
    await expect(
      this.toastNotification("Project created successfully"),
    ).toBeVisible();
    await expect(this.projectRow(payload.project_name)).toHaveCount(1);
  }
  /**
   * Check if the column header is visible. If not visible, it will include the column header.
   */
  async isColumnHeaderVisible(headerName) {
    const headerLocator = this.projectTableHeader(headerName);

    // Only asserts on the rendered layout. A column the list offers but does
    // not show is added with ColumnSettings.ensureColumnVisible first.
    await expect(headerLocator).toBeVisible();
  }
  /**
   * Verifies that all specified column headers are visible.
   * @param {string[]} columns - Array of column names to check.
   */
  async verifyColumnHeaders(columns) {
    for (const column of columns) {
      await this.isColumnHeaderVisible(column);
    }
  }
  /**
   * Get the list of project names currently displayed in the retainer public view.
   */
  async getProjectListInRetainerView() {
    // The saved-view list renders through the same grid as the default list, so
    // reuse the working row locator rather than the old table/td shape.
    return await this.getProjectList();
  }

  /**
   * Opens a view's row actions menu and reports which actions it offers.
   */
  async getViewRowActions(viewName) {
    await this.openViewMenu();
    const row = this.viewMenuItem(viewName);
    await row.waitFor({ state: "visible", timeout: 15000 });
    await row.hover();
    await this.page.waitForTimeout(600);
    await this.viewRowMenuButton(viewName).click({ force: true });
    await this.page.waitForTimeout(1200);

    const actions = (await this.page.getByRole("menuitem").allTextContents())
      .map((text) => text.replace(/\n/g, "").trim())
      .filter((text) =>
        /^(Duplicate|Edit|Make Public|Make Private|Delete)$/.test(text),
      );

    return actions;
  }

  /**
   * Opens a saved view by its visible label from the views menu.
   */
  async openSavedView(viewName) {
    await this.openViewMenu();
    const view = this.viewMenuItem(viewName);
    await view.waitFor({ state: "visible", timeout: 15000 });
    await view.click();
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
    await this.page.waitForTimeout(2500);
  }
}
