const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import {
  TASK,
  dueDateText,
  findTask,
  likedBy,
  seedTask,
  seedTasks,
} from "../../helpers/taskHelper";
import { TaskPage } from "../../pageObjects/taskPage";
import { getDocList, getDocument } from "../../utils/api/apiClient";
import { dayOfThisMonth } from "../../utils/dateUtils";
import { loadTestCase } from "../../utils/testCase";

const STATUSES = [
  "Open",
  "Working",
  "Pending Review",
  "Overdue",
  "Completed",
  "Cancelled",
];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const DEFAULT_HEADERS = [
  "Subject",
  "Project",
  "Status",
  "Expected time",
  "Priority",
  "Due date",
  "",
  "",
  "",
];

test.describe("Manager: Task list", () => {
  /** @type {TaskPage} */ let taskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
  });

  // The list scoped to a case's own project, so staging's other tasks stay out.
  const openProjectList = async (data, projectId) =>
    taskPage.gotoTasks({
      project: projectId,
      projectLabel: data.payloadCreateProject.project_name,
    });

  test("TC168: A task row shows its project, status, expected time, priority and due date", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC168");
    const projectName = data.payloadCreateProject.project_name;

    // One task per status; the last has no due date.
    const expected = [];
    for (const [index, status] of STATUSES.entries()) {
      const subject = `${data.task} ${status}`;
      const dueDate =
        index < STATUSES.length - 1 ? dayOfThisMonth(10 + index) : null;
      // The row shows the status the server kept: staging turns a new Open task into Working.
      const task = await seedTask(projectId, subject, {
        status,
        priority: PRIORITIES[index % PRIORITIES.length],
        expected_time: index + 1,
        ...(dueDate && { exp_end_date: dueDate }),
      });
      expected.push({
        subject,
        status: task.status,
        hours: `${index + 1}h`,
        priority: PRIORITIES[index % PRIORITIES.length],
        due: dueDate ? dueDateText(dueDate) : "N/A",
      });
    }

    await openProjectList(data, projectId);

    for (const { subject, status, hours, priority, due } of expected) {
      await expect(taskPage.rowOf(subject).getByRole("cell")).toHaveText([
        subject,
        projectName,
        status,
        hours,
        priority,
        due,
        "",
        "",
        "",
      ]);
    }
  });

  test("TC169: Scrolling to the bottom loads the next 20 tasks, and the list stops growing", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC169");
    await seedTasks(
      projectId,
      Array.from(
        { length: 21 },
        (_, index) => `${data.task} ${String(index + 1).padStart(2, "0")}`,
      ),
    );
    const starts = [];
    page.on("request", (request) => {
      if (request.url().includes("get_task_list")) {
        starts.push(new URL(request.url()).searchParams.get("start"));
      }
    });

    await openProjectList(data, projectId);
    await expect(taskPage.rows).toHaveCount(20);

    await taskPage.rows.last().scrollIntoViewIfNeeded();
    await expect(taskPage.rows).toHaveCount(21);

    // Nothing is left, so scrolling again asks for nothing more.
    await taskPage.rows.last().scrollIntoViewIfNeeded();
    await expect(taskPage.rows).toHaveCount(21);
    expect(starts).toEqual(["0", "20"]);
  });

  test("TC170: Search finds a task by its subject or its ID, and a term with no match shows No tasks found", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC170");
    const task = await seedTask(projectId, data.task);
    await seedTask(projectId, data.decoy);

    await openProjectList(data, projectId);
    await expect(taskPage.rows).toHaveCount(2);

    await taskPage.search(data.task);
    await expect(taskPage.subjectButtons).toHaveText([data.task]);

    await taskPage.search(task.name);
    await expect(taskPage.subjectButtons).toHaveText([data.task]);

    await taskPage.search(data.unknown);
    await expect(taskPage.emptyTaskList).toBeVisible();
  });

  test("TC171: The Project filter narrows the list to one project, and All shows every project again", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC171");
    const projectName = data.payloadCreateProject.project_name;
    const [other] = await getDocList(
      "Project",
      [["project_name", "=", data.payloadCreateProject2.project_name]],
      { fields: ["name"] },
    );
    await seedTask(projectId, data.first);
    await seedTask(other.name, data.second);

    // The search keeps the list to this case's two tasks.
    await taskPage.gotoTasks({ search: data.search });
    await expect(taskPage.subjectButtons).toHaveText([data.second, data.first]);

    await taskPage.chooseProject(projectName);
    await expect(taskPage.subjectButtons).toHaveText([data.first]);
    expect(taskPage.param("project")).toBe(projectId);
    expect(taskPage.param("projectLabel")).toBe(projectName);

    await taskPage.chooseProject("All");
    await expect(taskPage.subjectButtons).toHaveText([data.second, data.first]);
    expect(taskPage.param("project")).toBeNull();
  });

  test("TC172: The Status filter narrows the list, and several statuses combine", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC172");
    const subjectOf = (status) => `${data.task} ${status}`;
    for (const status of [
      "Working",
      "Pending Review",
      "Overdue",
      "Completed",
    ]) {
      await seedTask(projectId, subjectOf(status), { status });
    }

    await openProjectList(data, projectId);
    await expect(taskPage.rows).toHaveCount(4);

    await taskPage.toggleStatuses("Overdue");
    await expect(taskPage.subjectButtons).toHaveText([subjectOf("Overdue")]);
    expect(taskPage.statusParam()).toEqual(["Overdue"]);

    await taskPage.toggleStatuses("Completed");
    await expect(taskPage.subjectButtons).toHaveText([
      subjectOf("Completed"),
      subjectOf("Overdue"),
    ]);

    await taskPage.toggleStatuses("Overdue", "Completed");
    await expect(taskPage.rows).toHaveCount(4);
  });

  test("TC173: The Priority filter narrows the list with Equals and Not Equals", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC173");
    const subjectOf = (priority) => `${data.task} ${priority}`;
    for (const priority of PRIORITIES) {
      await seedTask(projectId, subjectOf(priority), { priority });
    }

    await openProjectList(data, projectId);
    await expect(taskPage.rows).toHaveCount(4);

    await taskPage.applyFilter({
      field: "Priority",
      operator: "Equals",
      value: "High",
    });
    await expect(taskPage.subjectButtons).toHaveText([subjectOf("High")]);

    await taskPage.applyFilter({
      field: "Priority",
      operator: "Not Equals",
      value: "High",
    });
    await expect(taskPage.subjectButtons).toHaveText([
      subjectOf("Urgent"),
      subjectOf("Medium"),
      subjectOf("Low"),
    ]);
  });

  test("TC174: The Due date filter narrows the list to a range", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC174");
    for (const day of [8, 15, 22]) {
      await seedTask(projectId, `${data.task} due ${day}`, {
        exp_end_date: dayOfThisMonth(day),
      });
    }

    await openProjectList(data, projectId);
    await expect(taskPage.rows).toHaveCount(3);

    await taskPage.applyDueDateRange(12, 18);
    await expect(taskPage.subjectButtons).toHaveText([`${data.task} due 15`]);
    expect(JSON.parse(taskPage.param("advanced"))[0]).toMatchObject({
      field: "exp_end_date",
      operator: "between",
      value: [dayOfThisMonth(12), dayOfThisMonth(18)],
    });
  });

  test("TC175: Search, Project, Status and the Filter panel combine, and Clear all filters removes them", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC175");
    const projectName = data.payloadCreateProject.project_name;
    const [other] = await getDocList(
      "Project",
      [["project_name", "=", data.payloadCreateProject2.project_name]],
      { fields: ["name"] },
    );
    const alpha = `${data.task} alpha`;
    await seedTask(projectId, alpha, { status: "Working", priority: "High" });
    await seedTask(projectId, `${data.task} beta`, {
      status: "Working",
      priority: "Low",
    });
    await seedTask(projectId, `${data.task} gamma`, {
      status: "Pending Review",
      priority: "High",
    });
    await seedTask(other.name, `${data.task} delta`, {
      status: "Working",
      priority: "High",
    });

    await taskPage.gotoTasks({ search: data.search });
    await expect(taskPage.rows).toHaveCount(4);

    await taskPage.chooseProject(projectName);
    await expect(taskPage.rows).toHaveCount(3);

    await taskPage.toggleStatuses("Working");
    await expect(taskPage.rows).toHaveCount(2);

    await taskPage.applyFilter({
      field: "Priority",
      operator: "Equals",
      value: "High",
    });
    await expect(taskPage.subjectButtons).toHaveText([alpha]);

    await taskPage.clearAllFiltersButton.click();
    await expect(taskPage.searchInput).toHaveValue("");
    for (const name of ["search", "project", "status", "advanced"]) {
      expect(taskPage.param(name)).toBeNull();
    }
  });

  test("TC176: The Sort menu defaults to Last updated, re-orders the list, and Clear sort goes back", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC176");
    const subjectOf = (letter) => `${data.task} ${letter}`;
    // Created B, C, A: the newest is listed first.
    for (const letter of ["B", "C", "A"]) {
      await seedTask(projectId, subjectOf(letter));
    }
    const byRecency = [subjectOf("A"), subjectOf("C"), subjectOf("B")];

    await openProjectList(data, projectId);
    await expect(taskPage.sortButton).toContainText("Last updated");
    await expect(taskPage.subjectButtons).toHaveText(byRecency);

    await taskPage.sortBy("Subject");
    await expect(taskPage.subjectButtons).toHaveText([
      subjectOf("C"),
      subjectOf("B"),
      subjectOf("A"),
    ]);
    expect(taskPage.param("sortField")).toBe("subject");
    await expect(taskPage.sortButton).toContainText("Subject");

    await taskPage.clearSort();
    await expect(taskPage.subjectButtons).toHaveText(byRecency);
    expect(taskPage.param("sortField")).toBeNull();
    await expect(taskPage.sortButton).toContainText("Last updated");
  });

  test("TC177: A column header sorts descending first and then ascending, and reports the direction", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC177");
    const subjectOf = (letter) => `${data.task} ${letter}`;
    for (const letter of ["B", "C", "A"]) {
      await seedTask(projectId, subjectOf(letter));
    }

    await openProjectList(data, projectId);
    const header = taskPage.columnHeader("Subject");
    await expect(header).toHaveAttribute("aria-sort", "none");

    await taskPage.clickHeader("Subject");
    await expect(header).toHaveAttribute("aria-sort", "descending");
    await expect(taskPage.subjectButtons).toHaveText([
      subjectOf("C"),
      subjectOf("B"),
      subjectOf("A"),
    ]);
    expect(taskPage.param("sortOrder")).toBe("desc");

    await taskPage.clickHeader("Subject");
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await expect(taskPage.subjectButtons).toHaveText([
      subjectOf("A"),
      subjectOf("B"),
      subjectOf("C"),
    ]);
    expect(taskPage.param("sortOrder")).toBe("asc");
  });

  test("TC178: The Columns menu hides and re-adds a column, and Reset restores the default set", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC178");
    await seedTask(projectId, data.task);

    await openProjectList(data, projectId);
    await expect(taskPage.columnHeader("Priority")).toBeVisible();

    await taskPage.removeColumn("Priority");
    await expect(taskPage.columnHeader("Priority")).toHaveCount(0);
    await expect(taskPage.rows.first().getByRole("cell")).toHaveCount(8);
    expect(taskPage.param("columnOrder")).toBe(
      "subject,project_name,status,expected_time,exp_end_date",
    );

    await taskPage.addColumn("Priority");
    await expect(taskPage.columnHeader("Priority")).toBeVisible();

    await taskPage.removeColumn("Priority");
    await taskPage.removeColumn("Due date");
    await expect(taskPage.columnHeader("Due date")).toHaveCount(0);

    await taskPage.resetColumns();
    await expect(taskPage.page.getByRole("columnheader")).toHaveText(
      DEFAULT_HEADERS,
    );
    expect(taskPage.param("columnOrder")).toBeNull();
  });

  test("TC179: Search, Project, Status, Filter, Sort and Columns stay applied after a reload and when the URL is opened directly", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC179");
    const projectName = data.payloadCreateProject.project_name;
    const alpha = `${data.task} alpha`;
    const beta = `${data.task} beta`;
    await seedTask(projectId, alpha, { status: "Working", priority: "High" });
    await seedTask(projectId, beta, { status: "Working", priority: "Low" });
    await seedTask(projectId, `${data.task} gamma`, {
      status: "Pending Review",
      priority: "High",
    });

    await taskPage.gotoTasks({ project: projectId, projectLabel: projectName });
    await taskPage.search(data.task);
    await taskPage.toggleStatuses("Working");
    await taskPage.applyFilter({
      field: "Priority",
      operator: "Not Equals",
      value: "Urgent",
    });
    await taskPage.clickHeader("Subject");
    await taskPage.removeColumn("Priority");
    await expect(taskPage.subjectButtons).toHaveText([beta, alpha]);
    await page.keyboard.press("Escape");
    const url = page.url();

    const stillApplied = async () => {
      await expect(taskPage.searchInput).toHaveValue(data.task);
      await expect(taskPage.subjectButtons).toHaveText([beta, alpha]);
      await expect(taskPage.columnHeader("Priority")).toHaveCount(0);
      await expect(taskPage.columnHeader("Subject")).toHaveAttribute(
        "aria-sort",
        "descending",
      );
      expect(taskPage.statusParam()).toEqual(["Working"]);
      expect(taskPage.param("project")).toBe(projectId);
      expect(JSON.parse(taskPage.param("advanced"))[0]).toMatchObject({
        field: "priority",
        operator: "!=",
        value: "Urgent",
      });
    };

    await page.reload();
    await taskPage.waitForList();
    await stillApplied();

    await page.goto("about:blank");
    await page.goto(url);
    await taskPage.waitForList();
    await stillApplied();
  });

  test("TC180: Add Task with empty fields shows a message under each required field and creates nothing", async ({
    page,
  }) => {
    allure.story("Task");
    const requests = [];
    page.on("request", (request) => {
      if (request.url().includes("task.add_task")) requests.push(request);
    });

    await taskPage.gotoTasks();
    await taskPage.openAddTask();
    await taskPage.submitButton.click();

    for (const message of [
      "Please select a project.",
      "Please add a subject.",
      "Please enter a valid time in hours.",
      "Please enter valid description.",
    ]) {
      await expect(taskPage.dialogMessage(message)).toBeVisible();
    }
    await expect(taskPage.taskDialog).toBeVisible();
    await expect(taskPage.toast("Task created successfully")).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test("TC181: Add Task saves a priority and a due date and shows them on the row, at the top of the list", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC181");
    const projectName = data.payloadCreateProject.project_name;
    await seedTask(projectId, "TC181 Task that is already there");

    await openProjectList(data, projectId);
    await taskPage.openAddTask();
    await taskPage.fillTask({
      project: projectName,
      subject: data.subject,
      priority: "High",
      hours: "4",
      dueDay: 20,
      description: data.description,
    });
    await taskPage.submitButton.click();

    await expect(taskPage.toast("Task created successfully")).toBeVisible();
    await expect(taskPage.taskDialog).toBeHidden();
    await expect.poll(() => findTask(data.subject)).toBeTruthy();
    const task = await findTask(data.subject);
    await expect(taskPage.rows.first().getByRole("cell")).toHaveText([
      data.subject,
      projectName,
      task.status,
      "4h",
      "High",
      dueDateText(dayOfThisMonth(20)),
      "",
      "",
      "",
    ]);
    expect(task).toMatchObject({
      project: projectId,
      priority: "High",
      expected_time: 4,
    });
    // Staging stores the due date with a time; a stock Task keeps just the date.
    expect(task.exp_end_date).toContain(dayOfThisMonth(20));
  });

  test("TC182: When creating a task fails, the error shows in the dialog, which stays open with its values", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC182");
    const projectName = data.payloadCreateProject.project_name;

    await openProjectList(data, projectId);
    await taskPage.openAddTask();
    await taskPage.fillTask({
      project: projectName,
      subject: data.subject,
      hours: "2",
      description: data.description,
    });
    await page.route("**/api/method/**task.add_task**", (route) =>
      route.abort(),
    );
    await taskPage.submitButton.click();

    await expect(taskPage.dialogMessage("Network Error")).toBeVisible();
    await expect(taskPage.taskDialog).toBeVisible();
    await expect(taskPage.subjectInput).toHaveValue(data.subject);
    await expect(taskPage.submitButton).toBeEnabled();
    await expect(taskPage.toast("Task created successfully")).toHaveCount(0);
    expect(await findTask(data.subject)).toBeUndefined();
  });

  test("TC184: Starring and unstarring a task toggles the star and keeps it after a reload", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC184");
    const task = await seedTask(projectId, data.task);
    const me = process.env.REP_MAN_EMAIL;
    const star = taskPage.starButton(data.task);

    await openProjectList(data, projectId);
    await expect(star).toHaveAttribute("aria-label", "Star task");

    await star.click();
    await expect(star).toHaveAttribute("aria-label", "Unstar task");
    await expect.poll(() => likedBy(task.name)).toContain(me);

    await page.reload();
    await taskPage.waitForList();
    await expect(star).toHaveAttribute("aria-label", "Unstar task");

    await star.click();
    await expect(star).toHaveAttribute("aria-label", "Star task");
    await expect.poll(() => likedBy(task.name)).not.toContain(me);
  });

  test("TC185: Edit opens pre-filled with the task's project, subject, priority, expected time, due date and description", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC185");
    const projectName = data.payloadCreateProject.project_name;
    await seedTask(projectId, data.task, {
      priority: "High",
      expected_time: 3,
      exp_end_date: dayOfThisMonth(20),
      description: data.description,
    });

    await openProjectList(data, projectId);
    await taskPage.chooseRowAction(data.task, "Edit");

    await expect(taskPage.submitButton).toBeVisible();
    await expect(taskPage.projectInput).toHaveValue(projectName);
    await expect(taskPage.subjectInput).toHaveValue(data.task);
    await expect(taskPage.priorityControl).toHaveText("High");
    await expect(taskPage.hoursInput).toHaveValue("3");
    await expect(taskPage.dueDateInput).toHaveValue(
      new RegExp(`^${dayOfThisMonth(20)}`),
    );
    await expect(taskPage.descriptionEditor).toContainText(data.description);
  });

  test("TC186: Edit saves the changes and shows Task updated successfully", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC186");
    const projectName = data.payloadCreateProject.project_name;
    const task = await seedTask(projectId, data.task, {
      priority: "Low",
      expected_time: 3,
      exp_end_date: dayOfThisMonth(20),
    });

    await openProjectList(data, projectId);
    await taskPage.chooseRowAction(data.task, "Edit");
    await expect(taskPage.submitButton).toBeVisible();
    await taskPage.subjectInput.fill(data.newSubject);
    await taskPage.setPriority("Urgent");
    await taskPage.hoursInput.fill("6");
    await taskPage.pickDueDate(25);
    await taskPage.descriptionEditor.fill(data.newDescription);
    await taskPage.submitButton.click();

    await expect(taskPage.toast("Task updated successfully")).toBeVisible();
    await expect(taskPage.rowOf(data.newSubject).getByRole("cell")).toHaveText([
      data.newSubject,
      projectName,
      task.status,
      "6h",
      "Urgent",
      dueDateText(dayOfThisMonth(25)),
      "",
      "",
      "",
    ]);
    const saved = await getDocument(TASK, task.name);
    expect(saved).toMatchObject({
      subject: data.newSubject,
      priority: "Urgent",
      expected_time: 6,
    });
    expect(saved.exp_end_date).toContain(dayOfThisMonth(25));
    expect(saved.description).toContain(data.newDescription);
  });

  test("TC187: Delete a task from the Task actions menu: Cancel keeps it, confirming removes it", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC187");
    await seedTask(projectId, data.task);

    await openProjectList(data, projectId);
    await taskPage.chooseRowAction(data.task, "Delete");
    const dialog = taskPage.page.getByRole("dialog").last();
    await expect(dialog).toContainText(
      "Are you sure you want to delete this task? This action cannot be undone.",
    );
    await taskPage.answerDialog("Cancel");
    await expect(dialog).toBeHidden();
    await expect(taskPage.rowOf(data.task)).toBeVisible();
    expect(await findTask(data.task)).toBeTruthy();

    await taskPage.chooseRowAction(data.task, "Delete");
    await taskPage.answerDialog("Delete");
    await expect(taskPage.toast("Task deleted")).toBeVisible();
    await expect(taskPage.rowOf(data.task)).toHaveCount(0);
    // By subject: Frappe hands a deleted task's name out again, so another test can own it.
    await expect.poll(() => findTask(data.task)).toBeUndefined();
  });

  test("TC188: A Projects Manager is offered Edit and Delete on every task", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC188");
    await seedTask(projectId, data.othersTask);
    await seedTask(projectId, data.ownTask, {}, "manager");

    await openProjectList(data, projectId);
    for (const subject of [data.othersTask, data.ownTask]) {
      await taskPage.openRowMenu(subject);
      await expect(taskPage.page.getByRole("menuitem")).toHaveText([
        "Edit",
        "Delete",
      ]);
      await taskPage.page.keyboard.press("Escape");
      await expect(taskPage.page.getByRole("menuitem")).toHaveCount(0);
    }
  });

  test("TC190: The task popup shows the team's time log to a Projects Manager", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC190");
    const task = data.payloadCreateTask.subject;
    const names = [
      (await getDocument("Employee", process.env.EMP_ID)).employee_name,
      (await getDocument("Employee", process.env.EMP3_ID)).employee_name,
    ];

    await openProjectList(data, projectId);
    await taskPage.openTaskDetails(task);

    const popup = taskPage.popup(task);
    await expect(popup).toContainText("Time entries");
    await expect(popup).toContainText("Last 15 days");
    for (const name of names) await expect(popup).toContainText(name);
    await expect(popup).toContainText("02:00");
    await expect(popup).toContainText("03:00");
  });
});
