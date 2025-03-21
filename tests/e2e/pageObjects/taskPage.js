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
    this.searchInput = page.getByPlaceholder("Subject").first();
    this.saveButton = page.getByRole("button", { name: "Save changes" });
    this.columnsButton = page.getByRole("button").filter({ has: page.locator("//p[text()='Columns']") });

    // Popper Modals
    this.columnMenu = page
      .locator("//div[@data-radix-popper-content-wrapper]")
      .filter({ has: page.getByRole("menuitem", { name: "Add Columns" }) });

    // Tasks Table
    this.tasksTable = page.getByRole("table");

    //Task button
    this.addTaskbutton = page.getByRole('button', { name: 'Task' });

    //Task Modal
    this.addTaskModal = page.getByRole('dialog', { name: 'Add Task' })

  }

  // --------------------------------------
  // General
  // --------------------------------------

  /**
   * Navigates to the task page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/task", { waitUntil: "domcontentloaded" });
  }

  // --------------------------------------
  // Top Task Search
  // --------------------------------------

  /**
   * Searches for a task in the search input.
   */
  async searchTask(name) {
    await this.searchInput.fill(name);
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
      .filter({ hasNot: this.page.getByRole("menuitem", { name: "Add Columns" }) });

    await this.columnsButton.click();
    await this.columnMenu.getByRole("menuitem", { name: "Add Columns" }).click();
    await columnSelectionMenu.locator(`//div[@role='menuitem' and text()='${name}']`).click();
    await this.searchInput.click({ force: true });
  }

  /**
   * Removes a column by de-selecting it from the Columns menu.
   */
  async removeColumn(name) {
    await this.columnsButton.click();
    await this.columnMenu.getByRole("menuitem", { name: name }).locator("//span").last().click();
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

    return this.tasksTable.locator("tbody").getByRole("row");
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
      const task = await cell.locator("//p").textContent();
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Checks if a given task is billable.
   */
  async isTaskBillable(task) {
    const text = await this.getCellText({ task: task, col: "Is Billable" });

    return text === "Yes";
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
    const headerCols = (await this.getHeaderRow()).locator("//p[@class='truncate']");
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
    const element = this.tasksTable.locator(`//p[text()='${task}']`).first();
    await element.click();
  }

  /**
   * Checks if the task details dialog with the specified name is visible.
   */
  async isTaskDetailsDialogVisible(name) {
    return this.page.getByRole("dialog", { name: name }).isVisible();
  }

  /**
   * Performs a search and selection within a modal based on a placeholder text.
   */
  async searchAndSelectOption(placeholder, value) {
    const searchButton = this.page.getByRole("button", { name: placeholder });
    const searchInput = this.page.getByRole("dialog").getByPlaceholder(`${placeholder}`);

    await searchButton.click();
    await searchInput.fill(value);
    await searchInput.press("ArrowDown+Enter");
  }


  /**
   * Adds a task by clicking on the Task button
   */
  async AddTask({ task, duration, project, desc }) {
    await this.page.pause();
    await this.addTaskbutton.click();
    await this.addTaskModal.getByPlaceholder("New subject").fill(task);

    await this.addTaskModal.getByPlaceholder("Time(in hours)").fill(duration);
    if (project) {
      await this.searchAndSelectOption("Search Project", project);
    }
   
    await this.addTaskModal.getByPlaceholder("Explain the subject").fill(desc);
    await this.addTaskModal.getByRole("button", { name: "Add Task" }).click();
  }
}
