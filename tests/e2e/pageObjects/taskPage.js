import { expect } from "@playwright/test";
import path from "path";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";

const TASK_TRACKER_PATH = path.resolve(
  __dirname,
  "../data/manager/tasks-to-delete.json",
);

/**
 * TaskPage class handles interactions with the task page.
 */
export class TaskPage {
  /**
   * Initializes the TeamPage object.
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // Header Filters
    this.searchInput = page.getByPlaceholder("Search task").first();
    this.getSearchInputByValue = (taskName) =>
      page.getByRole("textbox", { value: taskName });
    this.saveButton = page.getByRole("button", { name: "Save changes" });
    this.columnsButton = page
      .getByRole("button")
      .filter({ has: page.locator("//p[text()='Columns']") });

    // Popper Modals
    this.columnMenu = page
      .locator("//div[@data-radix-popper-content-wrapper]")
      .filter({ has: page.getByRole("menuitem", { name: "Add Columns" }) });

    // Tasks Table
    this.tasksTable = page.getByRole("table");
    // Matching a row by `hasText` is a substring match, which reports the wrong
    // status: searching "Performance Improvements" also matched the unrelated
    // billable task "Performance improvements - response times while browsing
    // desk". The subject cell's own button carries the exact accessible name.
    this.taskSubjectButton = (name) =>
      this.tasksTable.getByRole("button", { name, exact: true });
    this.emptyTaskList = page.getByText("No tasks found.");

    // Query-builder filter panel. The "Columns" button is gone from the
    // redesign, but "Is Billable" survived as a filter field
    // (custom_is_billable, Yes/No) declared in
    // frontend/packages/app/src/pages/tasks/components/subHeader.tsx.
    // Two controls answer to "Filter" - the toolbar button and one inside the
    // panel - so the toolbar one is always .first().
    this.filterButton = page.getByRole("button", { name: "Filter" }).first();
    this.filterFieldInput = page.getByPlaceholder("Field");
    this.filterOperatorInput = page.getByPlaceholder("Operator");
    this.filterValueInput = page.getByPlaceholder("Value");

    //Task button
    this.addTaskbutton = page.getByRole("button", {
      name: "Add Task",
      exact: true,
    });

    //Task Modal
    this.addTaskModal = page.getByRole("dialog");

    //Task Like option
    // The like control is a star now, not a heart, and it carries no data-task
    // attribute (there are zero on the page). Its state is in the aria-label:
    // "Star task" when not liked, "Unstar task" when liked - which is a far
    // steadier signal than the fill colour the old assertion compared.
    this.starButtonInRow = (taskName) =>
      page
        .getByRole("row")
        .filter({ hasText: taskName })
        .first()
        .getByRole("button", { name: /star task/i });

    //Success Banner
    this.successBanner = page
      .getByRole("region", { name: /notification/i })
      .getByText("Task created successfully");

    // Each task row exposes an "Add time" control instead of a titled clock icon.
    this.firstClockIcon = page
      .getByRole("button", { name: "Add time" })
      .first();

    //Add Time Modal
    this.timeSpent = page.getByRole("textbox", { name: ":00" });
    this.datePicker = page.getByRole("button", { name: "Today" });
    this.projectSelector = page.getByRole("button", {
      name: "Search Projects",
    });
    this.tasksSelector = page.getByRole("button", { name: "Search Task" });
    this.commentTextbox = page.getByRole("paragraph").filter({ hasText: /^$/ });
    // The modal submits with "Save and close" / "Save and add another".
    this.addTimeButton = page.getByRole("button", {
      name: "Save and close",
      exact: true,
    });
  }

  // --------------------------------------
  // General
  // --------------------------------------

  /**
   * Navigates to the task page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/tasks", { waitUntil: "domcontentloaded" });
  }

  // --------------------------------------
  // Top Task Search
  // --------------------------------------

  /**
   * Searches for a task in the search input.
   */
  async searchTask(name) {
    await this.searchInput.fill(name);
    //Verify that search input is filled
    await expect(this.getSearchInputByValue(name)).toBeVisible();
    await this.page.waitForSelector("svg.animate-spin", { state: "hidden" });
    await this.searchInput.press("ArrowDown+Enter");
  }

  // --------------------------------------
  // Top Columns Actions
  // --------------------------------------

  /**
   * Saves view by clicking on 'Save changes' button.
   */
  async saveView() {
    await this.saveButton.click();
  }

  /**
   * Adds a column by selecting it from the Columns menu.
   */
  async addColumn(name) {
    const columnSelectionMenu = this.page
      .locator("//div[@data-radix-popper-content-wrapper]")
      .filter({
        hasNot: this.page.getByRole("menuitem", { name: "Add Columns" }),
      });

    await this.columnsButton.click();
    await this.columnMenu
      .getByRole("menuitem", { name: "Add Columns" })
      .click();
    await columnSelectionMenu
      .locator(`//div[@role='menuitem' and text()='${name}']`)
      .click();
    await this.searchInput.click({ force: true });
  }

  /**
   * Removes a column by de-selecting it from the Columns menu.
   */
  async removeColumn(name) {
    await this.columnsButton.click();
    await this.columnMenu
      .getByRole("menuitem", { name: name })
      .locator("//span")
      .last()
      .click();
    await this.searchInput.click({ force: true });
  }

  // --------------------------------------
  // Tasks Table Actions
  // --------------------------------------

  /**
   * Retrieves the header row from the tasks table.
   */
  async getHeaderRow() {
    await this.tasksTable.waitFor({ state: "visible" });

    return this.tasksTable.locator("//thead//tr");
  }

  /**
   * Retrieves all task rows from the tasks table.
   */
  async getTaskRows() {
    await this.tasksTable.waitFor({ state: "visible" });

    return this.tasksTable.getByRole("rowgroup").getByRole("row");
  }

  /**
   * Retrieves the row containing the specified task name.
   */
  async getTaskRow(name) {
    await this.tasksTable.waitFor({ state: "visible" });

    return this.tasksTable.locator(`//tr[.//p[contains(text(), '${name}')]]`);
  }

  /**
   * Retrieves a list of task names from the tasks table.
   */
  async getTasks() {
    const tasks = [];
    const rows = await this.getTaskRows();

    for (const row of await rows.all()) {
      const cell = row.getByRole("cell").first();
      const task = await cell.textContent();
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Checks if a given task is billable, by which side of the "Is Billable"
   * filter it lands on.
   *
   * The redesign removed the Columns button, so there is no "Is Billable"
   * column left to read. Asking the filter is a stronger check anyway: it is
   * answered by the backend query (the request carries
   * `filters=[["custom_is_billable","=","1"]]`) rather than by whatever a cell
   * happens to render.
   *
   * Deliberately checks both directions and throws when they agree. A single
   * "does it appear under Yes?" probe returns false both for a non-billable
   * task and for a task that is missing entirely - which would let the
   * non-billable assertion pass while testing nothing.
   */
  async isTaskBillable(task) {
    await this.searchTask(task);
    // Let the search land before the filter goes on, so the filtered request
    // cannot race a still-pending unfiltered one. The result is discarded; the
    // call is here for its wait.
    await this.isTaskListed(task);

    // The search term survives a filter change (the refetch carries both), so
    // search once and flip the filter rather than redoing both each time.
    await this.filterByBillable("Yes");
    const listedAsBillable = await this.isTaskListed(task);

    await this.filterByBillable("No");
    const listedAsNonBillable = await this.isTaskListed(task);

    if (listedAsBillable === listedAsNonBillable) {
      throw new Error(
        `The "Is Billable" filter did not classify "${task}": ` +
          `listed under Yes=${listedAsBillable}, under No=${listedAsNonBillable}. ` +
          (listedAsBillable
            ? "Two tasks share this subject with different billable statuses."
            : "The task was not found under either value - check that it was seeded and that the manager can see its project."),
      );
    }

    return listedAsBillable;
  }

  /**
   * Whether a task with exactly this subject is in the current filtered list.
   */
  async isTaskListed(taskName) {
    const row = this.taskSubjectButton(taskName).first();

    // The list refetches on a debounce; reading the count too early returns the
    // previous filter's rows. Either the row or the empty state settles it.
    await Promise.race([
      row.waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
      this.emptyTaskList
        .waitFor({ state: "visible", timeout: 15000 })
        .catch(() => {}),
    ]);

    return (await row.count()) > 0;
  }

  // --------------------------------------
  // Filter Panel
  // --------------------------------------

  /**
   * Applies "Is Billable = <value>", replacing whatever condition the panel
   * currently holds.
   *
   * The panel opens with one condition row whose field is pre-filled
   * ("Priority") and whose value is empty; rewriting that row overwrites it
   * rather than stacking a second condition - verified on staging, where the
   * Filter badge stays at 1 and the request carries a single entry. So repeated
   * calls flip the value instead of ANDing two contradictory conditions, and no
   * reset is needed - which matters, because "Clear all filters" is currently
   * broken app-wide (see TC59).
   *
   * @param {"Yes"|"No"} value
   */
  async filterByBillable(value) {
    const pickOption = async (name) => {
      const option = this.page
        .getByRole("option", { name: new RegExp(`^${name}$`, "i") })
        .first();
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click();
    };

    if (
      !(await this.filterFieldInput
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await this.filterButton.click();
      await this.filterFieldInput
        .first()
        .waitFor({ state: "visible", timeout: 15000 });
    }

    const field = this.filterFieldInput.last();
    await field.click();
    await field.fill("Is Billable");
    await pickOption("Is Billable");

    // Choosing a field resets the operator, so it has to be re-picked. The
    // options are "Equals" / "Not Equals"; the anchored match excludes the latter.
    const operator = this.filterOperatorInput.last();
    await operator.click();
    await pickOption("Equals");

    // Wait for the list the new value produces before anything reads the rows.
    // Without this the previous filter's rows are still on screen and a presence
    // check returns the old answer: "Update api 2" measured as both billable and
    // non-billable. The response lands ~270ms after the click and the DOM
    // follows within ~3ms - but frappe-ui serves a repeat of a query it has
    // already run straight from cache, firing no request at all, so the wait
    // gives up quietly rather than failing when none arrives.
    const expected = value.toLowerCase() === "yes" ? "1" : "0";
    const refetched = this.page
      .waitForResponse(
        (resp) =>
          resp.url().includes("get_task_list") &&
          decodeURIComponent(resp.url()).includes(
            `["custom_is_billable","=","${expected}"]`,
          ),
        { timeout: 5000 },
      )
      .catch(() => {});

    const valueInput = this.filterValueInput.last();
    await valueInput.click();
    await pickOption(value);
    await refetched;
    await this.page.waitForTimeout(500);

    await this.page.keyboard.press("Escape");
    await this.filterFieldInput
      .first()
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  }

  /**
   * Checks if the specified column is present in table.
   */
  async isColumnPresent(name) {
    const headerRow = await this.getHeaderRow();
    const column = headerRow.locator("//th//p", { hasText: name });

    if ((await column.count()) > 0) {
      return true;
    }

    return false;
  }

  /**
   * Retrieves the column index by column name.
   * Return -1 if column is not found.
   */
  async getColIndex(name) {
    const headerCols = (await this.getHeaderRow()).locator(
      "//p[@class='truncate']",
    );
    const count = await headerCols.count();

    for (let idx = 0; idx < count; idx++) {
      const text = await headerCols.nth(idx).textContent();

      if (text === name) {
        return idx;
      }
    }

    return -1;
  }

  /**
   * Retrieves a table cell element based on the task and column name.
   */
  async getCell({ task, col }) {
    const row = await this.getTaskRow(task);
    const colIndex = await this.getColIndex(col);
    const cell = row.getByRole("cell").nth(colIndex);

    await cell.waitFor({ state: "visible" });

    return cell;
  }

  /**
   * Retrieves the text content of a table cell.
   */
  async getCellText(cellInfo) {
    const cell = await this.getCell(cellInfo);

    return (await cell.isVisible()) ? await cell.textContent() : "-";
  }

  // --------------------------------------
  // Task Details Dialog
  // --------------------------------------

  /**
   * Opens the details dialog of a specified task.
   */
  async openTaskDetails(task) {
    // The subject cell is a role=button div, not a <p>.
    const element = this.tasksTable
      .getByRole("button", { name: task, exact: true })
      .first();
    await element.click();
  }

  /**
   * Checks if the task details dialog with the specified name is visible.
   */
  async isTaskDetailsDialogVisible(name) {
    // The dialog carries no accessible name, so match on the task it shows.
    const dialog = this.page
      .getByRole("dialog")
      .filter({ hasText: name })
      .first();
    await dialog.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});

    return await dialog.isVisible().catch(() => false);
  }

  /**
   * Performs a search and selection within a modal based on a placeholder text.
   */
  async searchAndSelectOption(placeholder, value) {
    const searchButton = this.page.getByRole("button", { name: placeholder });
    const searchInput = this.page
      .getByRole("dialog")
      .getByPlaceholder(`${placeholder}`);

    await searchButton.click();
    await searchInput.fill(value);
    await searchInput.press("ArrowDown+Enter");
  }

  /**
   * Picks a value from one of the dialog's comboboxes by its placeholder.
   */
  async selectComboboxOption(placeholder, value) {
    const input = this.addTaskModal.getByPlaceholder(placeholder);

    await input.click();
    await input.fill(value);
    await this.page.waitForTimeout(1000);
    await this.page.getByRole("option", { name: value }).first().click();
  }

  /**
   * Adds a task by clicking on the Task button
   */
  async AddTask({ task, duration, project, desc }) {
    await this.addTaskbutton.click();
    await this.addTaskModal.getByPlaceholder("Add subject").fill(task);
    await this.addTaskModal.getByPlaceholder("Hours").fill(duration);
    await this.selectComboboxOption("Select project", project);
    await this.addTaskModal.locator("[contenteditable]").first().fill(desc);
    await this.addTaskModal.getByRole("button", { name: "Add Task" }).click();
    await expect(this.successBanner).toBeVisible();

    //  Write to task-tracking file
    const existingTasks = await readJSONFile(TASK_TRACKER_PATH);
    const taskList = Array.isArray(existingTasks) ? existingTasks : [];
    if (!taskList.includes(task)) {
      taskList.push(task);
      await writeDataToFile(TASK_TRACKER_PATH, taskList);
    }
  }

  /**
   * Asserts that the task's heart icon is in the liked state (red).
   */
  async assertTaskIsLiked(taskName) {
    // Takes the task's subject, not its ID: the row is only addressable by the
    // text it shows, since the ID is no longer in the DOM.
    const star = this.starButtonInRow(taskName).first();
    await star.waitFor({ state: "visible", timeout: 15000 });
    await expect(star).toHaveAttribute("aria-label", "Unstar task");
  }

  /**
   * Clicks on the first clock icon in the table
   * Use this after filtering by subject
   */
  async clickClockIcon() {
    await this.firstClockIcon.click();
  }

  async addTime(time, comment) {
    await this.timeSpent.fill(time);
    await this.commentTextbox.fill(comment);
    await this.addTimeButton.click();
  }
}
