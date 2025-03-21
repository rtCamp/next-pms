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
  // Tasks Table Actions
  // --------------------------------------

  /**
   * Retrieves the header row from the tasks table.
   */
  async getHeaderRow() {
    return this.tasksTable.locator("thead").getByRole("row");
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
