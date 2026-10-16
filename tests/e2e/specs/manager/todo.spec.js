const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { GrowthPage } from "../../pageObjects/growthPage";
import { TodoPage } from "../../pageObjects/todoPage";
import {
  INITIATIVE,
  TIMELINE_ITEM,
  TODO,
  findTodo,
  linkedTodoNames,
  seedInitiative,
  seedTimelineItem,
  seedTodo,
  seedTodos,
} from "../../helpers/todoHelper";
import { getDocument } from "../../utils/api/apiClient";
import { loadTestCase } from "../../utils/testCase";
import { scaleTimeout } from "../../utils/timeouts";

test.describe("Manager: Project ToDos", () => {
  /** @type {TodoPage} */ let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
  });

  test("TC142: Create a ToDo linked to a milestone, touchpoint or growth initiative", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC142");
    const milestone = await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
    );
    const touchpoint = await seedTimelineItem(
      projectId,
      "Touchpoint",
      data.touchpoint,
    );
    const initiative = await seedInitiative(projectId, data.initiative);

    await todoPage.gotoTodos(projectId);

    for (const { doctype, owner, linkTo, title } of [
      {
        doctype: TIMELINE_ITEM,
        owner: milestone,
        linkTo: data.milestone,
        title: data.milestoneTodo,
      },
      {
        doctype: TIMELINE_ITEM,
        owner: touchpoint,
        linkTo: data.touchpoint,
        title: data.touchpointTodo,
      },
      {
        doctype: INITIATIVE,
        owner: initiative,
        linkTo: data.initiative,
        title: data.initiativeTodo,
      },
    ]) {
      await todoPage.openNewTodo();
      await todoPage.createTodo({ title, linkTo });

      await expect(todoPage.toast("ToDo created")).toBeVisible();
      await expect(todoPage.linkedChip(title)).toContainText(linkTo);
      const todo = await findTodo(projectId, title);
      expect(await linkedTodoNames(doctype, owner.name)).toEqual([todo.name]);
    }
  });

  test("TC143: ToDo status Backlog and In Progress can be saved", async ({
    page,
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC143");
    const todo = await seedTodo(projectId, data.todo);

    await todoPage.gotoTodos(projectId);

    for (const status of ["Backlog", "In Progress"]) {
      await todoPage.openEdit(data.todo);
      await todoPage.setStatus(status);
      await todoPage.saveButton.click();

      await expect(todoPage.toast("ToDo updated")).toBeVisible();
      await expect
        .poll(async () => (await getDocument(TODO, todo.name)).status)
        .toBe(status);

      // Reopening the dialog shows the saved status.
      await todoPage.openEdit(data.todo);
      await expect(todoPage.statusSelect).toHaveText(status);
      await page.keyboard.press("Escape");
    }
  });

  test("TC144: Unlink a ToDo without deleting it; it stays on the ToDos tab", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC144");
    const todo = await seedTodo(projectId, data.todo);
    const milestone = await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
      [todo],
    );

    await todoPage.gotoTodos(projectId);
    await expect(todoPage.linkedChip(data.todo)).toContainText(data.milestone);

    await todoPage.chooseRowAction(data.todo, "Unlink");
    await expect(todoPage.dialog).toContainText(
      "The ToDo will not be deleted.",
    );
    await todoPage.answerDialog("Unlink");

    await expect(todoPage.toast("ToDo unlinked")).toBeVisible();
    await expect(todoPage.row(data.todo)).toBeVisible();
    await expect(todoPage.linkedChip(data.todo)).toHaveCount(0);
    expect(await getDocument(TODO, todo.name)).not.toBeNull();
    expect(await linkedTodoNames(TIMELINE_ITEM, milestone.name)).toEqual([]);

    await todoPage.gotoCalendarList(projectId, "milestones");
    await expect(todoPage.addTodoButton(data.milestone)).toBeVisible();
  });

  test("TC145: Add a linked ToDo directly from the Calendar list view", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC145");
    const milestone = await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
    );
    const touchpoint = await seedTimelineItem(
      projectId,
      "Touchpoint",
      data.touchpoint,
    );

    for (const { type, owner, title, todoTitle } of [
      {
        type: "milestones",
        owner: milestone,
        title: data.milestone,
        todoTitle: data.milestoneTodo,
      },
      {
        type: "touchpoints",
        owner: touchpoint,
        title: data.touchpoint,
        todoTitle: data.touchpointTodo,
      },
    ]) {
      await todoPage.gotoCalendarList(projectId, type);
      await todoPage.addTodoButton(title).click();
      // The dialog opens already linked to the row it was started from.
      await expect(todoPage.linkInput).toHaveValue(title);
      await todoPage.createTodo({ title: todoTitle });

      await expect(todoPage.toast("ToDo created")).toBeVisible();
      const cell = todoPage.todosCell(title);
      await expect(cell).toHaveAccessibleName("1 ToDo linked");
      await cell.hover();
      await expect(
        todoPage
          .popover(title)
          .getByRole("heading", { name: todoTitle, exact: true }),
      ).toBeVisible();

      const todo = await findTodo(projectId, todoTitle);
      expect(await linkedTodoNames(TIMELINE_ITEM, owner.name)).toEqual([
        todo.name,
      ]);
    }
  });

  test("TC146: The Calendar list view shows a milestone's or touchpoint's linked ToDos on hover", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC146");
    await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
      await seedTodos(projectId, data.milestoneTodos),
    );
    await seedTimelineItem(
      projectId,
      "Touchpoint",
      data.touchpoint,
      await seedTodos(projectId, data.touchpointTodos),
    );

    for (const { type, title, todoTitles } of [
      {
        type: "milestones",
        title: data.milestone,
        todoTitles: data.milestoneTodos,
      },
      {
        type: "touchpoints",
        title: data.touchpoint,
        todoTitles: data.touchpointTodos,
      },
    ]) {
      await todoPage.gotoCalendarList(projectId, type);

      const cell = todoPage.todosCell(title);
      await expect(cell).toHaveAccessibleName("2 ToDos linked");
      await cell.hover();

      const card = todoPage.popover(title);
      await expect(card).toBeVisible();
      for (const todoTitle of todoTitles) {
        await expect(
          card.getByRole("heading", { name: todoTitle, exact: true }),
        ).toBeVisible();
      }
    }
  });

  test("TC147: Completing or deleting a milestone or touchpoint keeps its linked ToDos, and deleting warns first", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC147");
    const todos = await seedTodos(projectId, data.todos);
    const touchpointTodo = await seedTodo(projectId, data.touchpointTodo);
    const milestone = await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
      todos,
    );
    const touchpoint = await seedTimelineItem(
      projectId,
      "Touchpoint",
      data.touchpoint,
      [touchpointTodo],
    );
    await seedTimelineItem(projectId, "Milestone", data.emptyMilestone);

    await todoPage.gotoCalendarList(projectId, "milestones");
    await expect(todoPage.todosCell(data.milestone)).toHaveAccessibleName(
      "2 ToDos linked",
    );

    await todoPage.chooseListAction(data.milestone, "Mark as completed");
    await expect
      .poll(
        async () =>
          (await getDocument(TIMELINE_ITEM, milestone.name)).is_complete,
      )
      .toBe(1);
    await expect(todoPage.todosCell(data.milestone)).toHaveAccessibleName(
      "2 ToDos linked",
    );
    expect(await linkedTodoNames(TIMELINE_ITEM, milestone.name)).toHaveLength(
      2,
    );

    // Deleting asks first, and cancelling deletes nothing.
    await todoPage.chooseListAction(data.milestone, "Delete");
    await expect(todoPage.dialog).toContainText(
      "Its linked ToDos will not be deleted.",
    );
    await todoPage.answerDialog("Cancel");
    expect(await getDocument(TIMELINE_ITEM, milestone.name)).not.toBeNull();

    // A milestone with no ToDos is deleted without that warning.
    await todoPage.chooseListAction(data.emptyMilestone, "Delete");
    await expect(todoPage.dialog).toContainText(
      `delete the milestone "${data.emptyMilestone}"`,
    );
    await expect(todoPage.dialog).not.toContainText("linked ToDos");
    await todoPage.answerDialog("Cancel");

    // The delete runs after the dialog's button is clicked, so wait for it.
    const gone = (item) =>
      expect
        .poll(() => getDocument(TIMELINE_ITEM, item.name), {
          timeout: scaleTimeout(30000),
        })
        .toBeNull();

    await todoPage.chooseListAction(data.milestone, "Delete");
    await todoPage.answerDialog("Delete");
    await gone(milestone);
    await expect(todoPage.listRow(data.milestone)).toHaveCount(0);

    await todoPage.gotoCalendarList(projectId, "touchpoints");
    await todoPage.chooseListAction(data.touchpoint, "Delete");
    await expect(todoPage.dialog).toContainText(
      "Its linked ToDos will not be deleted.",
    );
    await todoPage.answerDialog("Delete");
    await gone(touchpoint);

    // Every ToDo survives, and none is linked to anything any more.
    await todoPage.gotoTodos(projectId);
    for (const [todo, title] of [
      [todos[0], data.todos[0]],
      [todos[1], data.todos[1]],
      [touchpointTodo, data.touchpointTodo],
    ]) {
      expect(await getDocument(TODO, todo.name)).not.toBeNull();
      await expect(todoPage.row(title)).toBeVisible();
      await expect(todoPage.linkedChip(title)).toHaveCount(0);
    }
  });

  test("TC148: The growth initiative's Action items section adds a new item", async ({
    page,
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC148");
    const initiative = await seedInitiative(projectId, data.initiative);
    const growthPage = new GrowthPage(page);

    await growthPage.goto(projectId);
    await growthPage.openDetail(data.initiative);
    await expect(
      todoPage.actionItems.getByText("No action items yet."),
    ).toBeVisible();

    await todoPage.addActionItemButton.click();
    await expect(todoPage.linkInput).toHaveValue(data.initiative);
    await todoPage.createTodo({ title: data.todo });

    await expect(todoPage.toast("ToDo created")).toBeVisible();
    await expect(
      todoPage.actionItems.getByRole("heading", {
        name: data.todo,
        exact: true,
      }),
    ).toBeVisible();
    const todo = await findTodo(projectId, data.todo);
    expect(await linkedTodoNames(INITIATIVE, initiative.name)).toEqual([
      todo.name,
    ]);

    await todoPage.gotoTodos(projectId);
    await expect(todoPage.linkedChip(data.todo)).toContainText(data.initiative);
  });

  test("TC149: Add a ToDo on the ToDos tab and complete it", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC149");

    await todoPage.gotoTodos(projectId);
    await expect(todoPage.emptyMessage).toBeVisible();

    await todoPage.openNewTodo();
    await todoPage.createTodo({ title: data.todo });
    await expect(todoPage.toast("ToDo created")).toBeVisible();
    await expect(todoPage.row(data.todo)).toBeVisible();
    const todo = await findTodo(projectId, data.todo);
    expect(todo.status).toBe("Open");

    await todoPage
      .row(data.todo)
      .getByRole("button", { name: "Mark as done" })
      .click();
    await expect
      .poll(async () => (await getDocument(TODO, todo.name)).status)
      .toBe("Closed");

    await todoPage
      .row(data.todo)
      .getByRole("button", { name: "Reopen" })
      .click();
    await expect
      .poll(async () => (await getDocument(TODO, todo.name)).status)
      .toBe("Open");
    await expect(
      todoPage.row(data.todo).getByRole("button", { name: "Mark as done" }),
    ).toBeVisible();
  });
});
