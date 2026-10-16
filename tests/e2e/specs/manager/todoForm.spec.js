const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import {
  TIMELINE_ITEM,
  TODO,
  dayOfThisMonth,
  extraStatuses,
  findTodo,
  fullNameOf,
  getTodoMeta,
  linkedTodoNames,
  rowDate,
  seedTimelineItem,
  seedTodo,
  todosOfProject,
} from "../../helpers/todoHelper";
import { TodoPage } from "../../pageObjects/todoPage";
import { getDocList, getDocument } from "../../utils/api/apiClient";
import { loadTestCase } from "../../utils/testCase";
import { scaleTimeout } from "../../utils/timeouts";

const NO_CUSTOM_FIELDS =
  "Skipped: this site has no ToDo Title, Start and End custom fields, so the form has none of these.";

const assigneeHref = (email) => `/desk/user/${encodeURIComponent(email)}`;

test.describe("Manager: ToDo form", () => {
  /** @type {TodoPage} */ let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
  });

  test("TC151: Closing the create dialog with Escape creates nothing, and reopening it shows a blank form", async ({
    page,
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { hasCustomFields } = await getTodoMeta();
    const { data, projectId } = await loadTestCase(jsonDir, "TC151");

    await todoPage.gotoTodos(projectId);
    await todoPage.openNewTodo();
    await todoPage.fillTodo({ title: data.todo });
    await page.keyboard.press("Escape");

    await expect(todoPage.form).toBeHidden();
    expect(await todosOfProject(projectId)).toEqual([]);
    await expect(todoPage.emptyMessage).toBeVisible();

    await todoPage.openNewTodo();
    await expect(todoPage.editor).toHaveText("");
    await expect(todoPage.statusSelect).toHaveText("Open");
    await expect(todoPage.prioritySelect).toHaveText("Medium");
    if (hasCustomFields) {
      await expect(todoPage.titleInput).toHaveValue("");
      await expect(todoPage.startTrigger).toHaveText("Start");
      await expect(todoPage.endTrigger).toHaveText("End");
    }
  });

  test("TC152: ToDo form validation: Title, Start and End are required and an End before the Start is rejected", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { hasCustomFields } = await getTodoMeta();
    test.skip(!hasCustomFields, NO_CUSTOM_FIELDS);
    const { data, projectId } = await loadTestCase(jsonDir, "TC152");

    await todoPage.gotoTodos(projectId);
    await todoPage.openNewTodo();

    await todoPage.createButton.click();
    for (const message of [
      "Title is required.",
      "Start is required.",
      "End is required.",
    ]) {
      await expect(todoPage.fieldError(message)).toBeVisible();
    }
    expect(await todosOfProject(projectId)).toEqual([]);

    await todoPage.titleInput.fill(data.todo);
    await todoPage.pickDate(todoPage.startTrigger, 20);
    await todoPage.pickDate(todoPage.endTrigger, 15);
    await todoPage.createButton.click();
    await expect(
      todoPage.fieldError("End must be on or after start."),
    ).toBeVisible();
    expect(await todosOfProject(projectId)).toEqual([]);

    await todoPage.pickDate(todoPage.endTrigger, 25);
    await todoPage.createButton.click();
    await expect(todoPage.toast("ToDo created")).toBeVisible();
    expect(await todosOfProject(projectId)).toHaveLength(1);
  });

  test("TC153: Create a ToDo with title, description, start, end and priority; every value is saved and shown on its row", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { hasCustomFields } = await getTodoMeta();
    test.skip(!hasCustomFields, NO_CUSTOM_FIELDS);
    const { data, projectId } = await loadTestCase(jsonDir, "TC153");

    await todoPage.gotoTodos(projectId);
    await todoPage.openNewTodo();
    await expect(todoPage.statusSelect).toHaveText("Open");
    await expect(todoPage.prioritySelect).toHaveText("Medium");

    await todoPage.createTodo({
      title: data.todo,
      description: data.description,
      priority: "High",
      startDay: 12,
      endDay: 18,
    });
    await expect(todoPage.toast("ToDo created")).toBeVisible();

    const [todo] = await getDocList(
      TODO,
      [
        ["reference_type", "=", "Project"],
        ["reference_name", "=", projectId],
      ],
      {
        fields: [
          "custom_title",
          "description",
          "custom_from_time",
          "custom_to_time",
          "priority",
          "status",
          "reference_type",
          "reference_name",
        ],
      },
    );
    expect(todo).toMatchObject({
      custom_title: data.todo,
      priority: "High",
      status: "Open",
      reference_type: "Project",
      reference_name: projectId,
    });
    expect(todo.description).toContain(data.description);
    expect(todo.custom_from_time).toContain(`${dayOfThisMonth(12)} 00:00:00`);
    expect(todo.custom_to_time).toContain(`${dayOfThisMonth(18)} 00:00:00`);

    const row = todoPage.row(data.todo);
    await expect(row).toContainText("High");
    await expect(row).toContainText(rowDate(12));
    await expect(row).toContainText(rowDate(18));
  });

  test("TC154: A ToDo created without touching Assignee is assigned to the signed-in user", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC154");

    await todoPage.gotoTodos(projectId);
    await todoPage.openNewTodo();
    await todoPage.createTodo({ title: data.todo });
    await expect(todoPage.row(data.todo)).toBeVisible();

    const todo = await findTodo(projectId, data.todo);
    expect((await getDocument(TODO, todo.name)).allocated_to).toBe(
      process.env.REP_MAN_EMAIL,
    );
    await expect(todoPage.assigneeLink(data.todo)).toHaveAttribute(
      "href",
      assigneeHref(process.env.REP_MAN_EMAIL),
    );
  });

  test("TC155: The priority and a non-default status chosen in the create dialog are saved and shown", async ({
    page,
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC155");
    // Backlog and In Progress only where the site accepts them (rtCamp/next-pms#2278).
    const statuses = await extraStatuses();

    await todoPage.gotoTodos(projectId);
    for (const [index, priority] of ["Low", "Medium", "High"].entries()) {
      const status = statuses[index % statuses.length];
      const title = `${data.todo} ${priority}`;

      await todoPage.openNewTodo();
      await todoPage.createTodo({ title, priority, status });
      await expect(todoPage.row(title)).toContainText(priority);

      const todo = await findTodo(projectId, title);
      expect(await getDocument(TODO, todo.name)).toMatchObject({
        priority,
        status,
      });

      // The row prints no status, so reopen the dialog to see it.
      await todoPage.openEdit(title);
      await expect(todoPage.statusSelect).toHaveText(status);
      await expect(todoPage.prioritySelect).toHaveText(priority);
      await page.keyboard.press("Escape");
      await expect(todoPage.form).toBeHidden();
    }
  });

  test("TC156: When saving fails an error toast shows and nothing changes", async ({
    page,
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC156");
    const seeded = await seedTodo(projectId, data.statusTodo);

    await todoPage.gotoTodos(projectId);
    await todoPage.openNewTodo();
    await todoPage.fillTodo({ title: data.todo });

    const createUrl = "**/api/resource/ToDo";
    await page.route(createUrl, (route) =>
      route.request().method() === "POST" ? route.abort() : route.continue(),
    );
    await todoPage.createButton.click();

    await expect(todoPage.toast("Network Error")).toBeVisible();
    await expect(todoPage.form).toBeVisible();
    await expect(todoPage.editor).toContainText(data.todo);
    await expect(todoPage.toast("ToDo created")).toHaveCount(0);
    expect(await todosOfProject(projectId)).toHaveLength(1);

    await page.unroute(createUrl);
    await page.keyboard.press("Escape");
    await expect(todoPage.form).toBeHidden();
    // The first toast must be gone, or it would satisfy the next check by itself.
    await expect(todoPage.toast("Network Error")).toBeHidden({
      timeout: scaleTimeout(15000),
    });

    await page.route(`**/api/resource/ToDo/${seeded.name}`, (route) =>
      route.request().method() === "PUT" ? route.abort() : route.continue(),
    );
    await todoPage.doneButton(data.statusTodo).click();

    await expect(todoPage.toast("Network Error")).toBeVisible();
    await expect(todoPage.doneButton(data.statusTodo)).toBeVisible();
    await expect(todoPage.reopenButton(data.statusTodo)).toHaveCount(0);
    expect((await getDocument(TODO, seeded.name)).status).toBe("Open");
  });

  test("TC157: Edit opens pre-filled with the ToDo's values", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { hasCustomFields } = await getTodoMeta();
    test.skip(!hasCustomFields, NO_CUSTOM_FIELDS);
    const { data, projectId } = await loadTestCase(jsonDir, "TC157");
    const assignee = process.env.EMP_EMAIL;
    const todo = await seedTodo(projectId, data.todo, {
      description: data.description,
      status: "Cancelled",
      priority: "High",
      allocated_to: assignee,
      custom_from_time: `${dayOfThisMonth(12)} 10:30:00`,
      custom_to_time: `${dayOfThisMonth(18)} 11:45:00`,
    });
    await seedTimelineItem(projectId, "Milestone", data.milestone, [todo]);

    await todoPage.gotoTodos(projectId);
    await todoPage.openEdit(data.todo);

    await expect(todoPage.titleInput).toHaveValue(data.todo);
    await expect(todoPage.editor).toContainText(data.description);
    await expect(todoPage.statusSelect).toHaveText("Cancelled");
    await expect(todoPage.prioritySelect).toHaveText("High");
    await expect(todoPage.startTrigger).toHaveText(
      `${dayOfThisMonth(12)} 10:30 am`,
    );
    await expect(todoPage.endTrigger).toHaveText(
      `${dayOfThisMonth(18)} 11:45 am`,
    );
    await expect(todoPage.linkInput).toHaveValue(data.milestone);

    // The assignee field names only users among the first 20 the picker loads,
    // so it is checked the way that matters: saving untouched must keep it.
    await todoPage.saveButton.click();
    await expect(todoPage.form).toBeHidden();
    await expect
      .poll(async () => (await getDocument(TODO, todo.name)).modified)
      .not.toBe(todo.modified);
    expect(await getDocument(TODO, todo.name)).toMatchObject({
      allocated_to: assignee,
      status: "Cancelled",
      priority: "High",
      custom_title: data.todo,
    });
    expect((await getDocument(TODO, todo.name)).custom_from_time).toContain(
      `${dayOfThisMonth(12)} 10:30:00`,
    );
    expect((await getDocument(TODO, todo.name)).custom_to_time).toContain(
      `${dayOfThisMonth(18)} 11:45:00`,
    );
  });

  test("TC158: Edit a ToDo's assignee, priority and description and the changes persist after reload", async ({
    page,
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { hasCustomFields } = await getTodoMeta();
    const { data, projectId } = await loadTestCase(jsonDir, "TC158");
    const assignee = process.env.EMP_EMAIL;
    const todo = await seedTodo(projectId, data.todo);

    await todoPage.gotoTodos(projectId);
    await todoPage.openEdit(data.todo);
    await todoPage.chooseAssignee(await fullNameOf(assignee));
    await todoPage.setPriority("High");
    await todoPage.appendToDescription(data.addedText);
    await todoPage.saveButton.click();
    await expect(todoPage.toast("ToDo updated")).toBeVisible();

    await page.reload();
    // Without the Title field the description is the row's title.
    const title = hasCustomFields ? data.todo : `${data.todo}${data.addedText}`;
    await expect(todoPage.row(title)).toContainText("High");
    await expect(todoPage.assigneeLink(title)).toHaveAttribute(
      "href",
      assigneeHref(assignee),
    );

    const saved = await getDocument(TODO, todo.name);
    expect(saved).toMatchObject({ allocated_to: assignee, priority: "High" });
    expect(saved.description).toContain(data.addedText);
  });

  test("TC159: Link an unlinked ToDo from the Edit dialog, then clear its link there", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC159");
    const todo = await seedTodo(projectId, data.todo);
    const milestone = await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
    );

    await todoPage.gotoTodos(projectId);
    await expect(todoPage.row(data.todo)).toBeVisible();
    await expect(todoPage.linkedChip(data.todo)).toHaveCount(0);

    await todoPage.openEdit(data.todo);
    await todoPage.chooseLink(data.milestone);
    await todoPage.saveButton.click();
    await expect(todoPage.linkedChip(data.todo)).toContainText(data.milestone);
    expect(await linkedTodoNames(TIMELINE_ITEM, milestone.name)).toEqual([
      todo.name,
    ]);

    await todoPage.gotoCalendarList(projectId, "milestones");
    await expect(todoPage.todosCell(data.milestone)).toHaveAccessibleName(
      "1 ToDo linked",
    );

    await todoPage.gotoTodos(projectId);
    await todoPage.openEdit(data.todo);
    await todoPage.clearLinkButton.click();
    await todoPage.saveButton.click();
    await expect(todoPage.row(data.todo)).toBeVisible();
    await expect(todoPage.linkedChip(data.todo)).toHaveCount(0);
    expect(await linkedTodoNames(TIMELINE_ITEM, milestone.name)).toEqual([]);

    await todoPage.gotoCalendarList(projectId, "milestones");
    await expect(todoPage.addTodoButton(data.milestone)).toBeVisible();
  });

  test("TC160: Move a ToDo to another milestone by editing its link", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC160");
    const todo = await seedTodo(projectId, data.todo);
    const first = await seedTimelineItem(
      projectId,
      "Milestone",
      data.firstMilestone,
      [todo],
    );
    const second = await seedTimelineItem(
      projectId,
      "Milestone",
      data.secondMilestone,
    );

    await todoPage.gotoTodos(projectId);
    await expect(todoPage.linkedChip(data.todo)).toContainText(
      data.firstMilestone,
    );

    await todoPage.openEdit(data.todo);
    await todoPage.chooseLink(data.secondMilestone);
    await todoPage.saveButton.click();

    await expect(todoPage.linkedChip(data.todo)).toContainText(
      data.secondMilestone,
    );
    expect(await linkedTodoNames(TIMELINE_ITEM, first.name)).toEqual([]);
    expect(await linkedTodoNames(TIMELINE_ITEM, second.name)).toEqual([
      todo.name,
    ]);
  });
});
