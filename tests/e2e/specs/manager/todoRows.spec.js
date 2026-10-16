const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import {
  TIMELINE_ITEM,
  TODO,
  dayOfThisMonth,
  extraStatuses,
  linkedTodoNames,
  milestoneAndTouchpointDays,
  seedInitiative,
  seedTimelineItem,
  seedTodo,
  seedTodos,
} from "../../helpers/todoHelper";
import { TodoPage } from "../../pageObjects/todoPage";
import { getDocList, getDocument } from "../../utils/api/apiClient";
import { loadTestCase } from "../../utils/testCase";

test.describe("Manager: ToDo rows", () => {
  /** @type {TodoPage} */ let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
  });

  test("TC150: The ToDos tab lists only this project's ToDos", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC150");
    const [other] = await getDocList(
      "Project",
      [["project_name", "=", data.payloadCreateProject2.project_name]],
      { fields: ["name"] },
    );
    await seedTodo(projectId, data.todo);
    await seedTodo(other.name, data.otherTodo);

    await todoPage.gotoTodos(projectId);
    await expect(todoPage.row(data.todo)).toBeVisible();
    await expect(todoPage.row(data.otherTodo)).toHaveCount(0);

    await todoPage.gotoTodos(other.name);
    await expect(todoPage.row(data.otherTodo)).toBeVisible();
    await expect(todoPage.row(data.todo)).toHaveCount(0);
  });

  test("TC161: Mark as done sets any open status to Closed, and Reopen sets it back to Open", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC161");
    // Backlog and In Progress only where the site accepts them (rtCamp/next-pms#2278).
    const cases = [];
    for (const status of await extraStatuses()) {
      const title = `${data.todo} ${status}`;
      cases.push({ title, todo: await seedTodo(projectId, title, { status }) });
    }

    await todoPage.gotoTodos(projectId);
    for (const { title, todo } of cases) {
      await todoPage.doneButton(title).click();
      await expect
        .poll(async () => (await getDocument(TODO, todo.name)).status)
        .toBe("Closed");
      await expect(todoPage.reopenButton(title)).toBeVisible();

      await todoPage.reopenButton(title).click();
      await expect
        .poll(async () => (await getDocument(TODO, todo.name)).status)
        .toBe("Open");
      await expect(todoPage.doneButton(title)).toBeVisible();
    }
  });

  test("TC162: The linked chip on a ToDo row opens its milestone, touchpoint or growth initiative", async ({
    page,
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC162");
    const milestoneTodo = await seedTodo(projectId, data.milestoneTodo);
    const touchpointTodo = await seedTodo(projectId, data.touchpointTodo);
    const initiativeTodo = await seedTodo(projectId, data.initiativeTodo);
    await seedTimelineItem(projectId, "Milestone", data.milestone, [
      milestoneTodo,
    ]);
    await seedTimelineItem(projectId, "Touchpoint", data.touchpoint, [
      touchpointTodo,
    ]);
    const initiative = await seedInitiative(projectId, data.initiative, [
      initiativeTodo,
    ]);

    const param = (name) => new URL(page.url()).searchParams.get(name);

    await todoPage.gotoTodos(projectId);
    await todoPage.linkedChip(data.milestoneTodo).click();
    await expect.poll(() => param("tab")).toBe("calendar");
    expect(param("type")).toBe("milestones");
    expect(param("search")).toBe(data.milestone);
    await expect(todoPage.listRow(data.milestone)).toBeVisible();

    await todoPage.gotoTodos(projectId);
    await todoPage.linkedChip(data.touchpointTodo).click();
    await expect.poll(() => param("tab")).toBe("calendar");
    expect(param("type")).toBe("touchpoints");
    expect(param("search")).toBe(data.touchpoint);
    await expect(todoPage.listRow(data.touchpoint)).toBeVisible();

    await todoPage.gotoTodos(projectId);
    await todoPage.linkedChip(data.initiativeTodo).click();
    await expect.poll(() => param("tab")).toBe("growth");
    expect(param("growth")).toBe(initiative.name);
    await expect(
      page.getByRole("button", { name: "Back to growth initiatives" }),
    ).toBeVisible();
  });

  test("TC163: The row menu offers Unlink only for a linked ToDo", async ({
    page,
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC163");
    const linked = await seedTodo(projectId, data.linkedTodo);
    await seedTodo(projectId, data.unlinkedTodo);
    await seedTimelineItem(projectId, "Milestone", data.milestone, [linked]);

    await todoPage.gotoTodos(projectId);
    await expect(todoPage.linkedChip(data.linkedTodo)).toBeVisible();

    await todoPage.openRowMenu(data.linkedTodo);
    await expect(todoPage.menuItems()).toHaveText(["Edit", "Unlink", "Delete"]);
    await page.keyboard.press("Escape");
    await expect(todoPage.menuItems()).toHaveCount(0);

    await todoPage.openRowMenu(data.unlinkedTodo);
    await expect(todoPage.menuItems()).toHaveText(["Edit", "Delete"]);
  });

  test("TC164: Cancel on a ToDo's own Delete and Unlink confirmations changes nothing", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC164");
    const todo = await seedTodo(projectId, data.todo);
    const milestone = await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
      [todo],
    );
    const untouched = async () => {
      expect(await getDocument(TODO, todo.name)).not.toBeNull();
      expect(await linkedTodoNames(TIMELINE_ITEM, milestone.name)).toEqual([
        todo.name,
      ]);
      await expect(todoPage.row(data.todo)).toBeVisible();
      await expect(todoPage.linkedChip(data.todo)).toContainText(
        data.milestone,
      );
    };

    await todoPage.gotoTodos(projectId);
    await expect(todoPage.linkedChip(data.todo)).toBeVisible();

    await todoPage.chooseRowAction(data.todo, "Delete");
    await expect(todoPage.dialog).toContainText(
      `It will also be removed from the milestone "${data.milestone}".`,
    );
    await todoPage.answerDialog("Cancel");
    await expect(todoPage.dialog).toBeHidden();
    await untouched();

    await todoPage.chooseRowAction(data.todo, "Unlink");
    await expect(todoPage.dialog).toContainText(
      "The ToDo will not be deleted.",
    );
    await todoPage.answerDialog("Cancel");
    await expect(todoPage.dialog).toBeHidden();
    await untouched();
  });

  test("TC165: Delete a ToDo from the ToDos tab; the confirmation names its milestone and the milestone's count drops", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC165");
    const [doomed, kept] = await seedTodos(projectId, data.todos);
    const milestone = await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
      [doomed, kept],
    );

    await todoPage.gotoTodos(projectId);
    await todoPage.chooseRowAction(data.todos[0], "Delete");
    await expect(todoPage.dialog).toContainText(
      `It will also be removed from the milestone "${data.milestone}".`,
    );
    await todoPage.answerDialog("Delete");

    await expect(todoPage.toast("ToDo deleted")).toBeVisible();
    await expect(todoPage.row(data.todos[0])).toHaveCount(0);
    await expect.poll(() => getDocument(TODO, doomed.name)).toBeNull();
    expect(await linkedTodoNames(TIMELINE_ITEM, milestone.name)).toEqual([
      kept.name,
    ]);

    await todoPage.gotoCalendarList(projectId, "milestones");
    await expect(todoPage.todosCell(data.milestone)).toHaveAccessibleName(
      "1 ToDo linked",
    );
  });

  test("TC166: Add another ToDo to a milestone from the Add ToDo button in its hover card", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC166");
    const first = await seedTodo(projectId, data.todo);
    const milestone = await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
      [first],
    );

    await todoPage.gotoCalendarList(projectId, "milestones");
    const cell = todoPage.todosCell(data.milestone);
    await expect(cell).toHaveAccessibleName("1 ToDo linked");
    await cell.hover();
    await expect(todoPage.popover(data.milestone)).toBeVisible();
    await todoPage.popoverAddButton(data.milestone).click();

    // The dialog opens already linked to the milestone.
    await expect(todoPage.linkInput).toHaveValue(data.milestone);
    await todoPage.createTodo({ title: data.addedTodo });
    await expect(todoPage.toast("ToDo created")).toBeVisible();

    await expect(cell).toHaveAccessibleName("2 ToDos linked");
    await cell.hover();
    for (const title of [data.todo, data.addedTodo]) {
      await expect(
        todoPage
          .popover(data.milestone)
          .getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    }
    expect(await linkedTodoNames(TIMELINE_ITEM, milestone.name)).toHaveLength(
      2,
    );
  });

  test("TC167: The Calendar grid hover card shows N ToDos only for an item that has linked ToDos", async ({
    jsonDir,
  }) => {
    allure.story("ToDo");
    const { data, projectId } = await loadTestCase(jsonDir, "TC167");
    const days = milestoneAndTouchpointDays();
    await seedTimelineItem(
      projectId,
      "Milestone",
      data.milestone,
      await seedTodos(projectId, data.todos),
      dayOfThisMonth(days.milestone),
    );
    await seedTimelineItem(
      projectId,
      "Touchpoint",
      data.touchpoint,
      [],
      dayOfThisMonth(days.touchpoint),
    );

    await todoPage.gotoCalendarGrid(projectId);

    await todoPage.gridPill(data.milestone).hover();
    const milestoneCard = todoPage.gridCard(data.milestone);
    await expect(milestoneCard).toBeVisible();
    await expect(milestoneCard).toContainText("2 ToDos");

    await todoPage.gridPill(data.touchpoint).hover();
    const touchpointCard = todoPage.gridCard(data.touchpoint);
    await expect(touchpointCard).toBeVisible();
    // Not /ToDos?$/: the touchpoint's own title ends in "ToDos".
    await expect(touchpointCard.getByText(/^\d+ ToDos?$/)).toHaveCount(0);
  });
});
