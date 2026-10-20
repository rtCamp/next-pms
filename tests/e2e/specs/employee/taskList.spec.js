const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { seedTask } from "../../helpers/taskHelper";
import { TaskPage } from "../../pageObjects/taskPage";
import { getDocument } from "../../utils/api/apiClient";
import { loadTestCase } from "../../utils/testCase";

test.describe("Employee: Task list", () => {
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

  test("TC183: Time logged from a row's clock appears under Time entries in the task's popup", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC183");
    const projectName = data.payloadCreateProject.project_name;
    await seedTask(projectId, data.task);

    await openProjectList(data, projectId);
    await taskPage.addTimeButtonOf(data.task).click();

    // The dialog opens with the row's project and task already chosen.
    const dialog = page.getByRole("dialog", { name: "Add time" });
    await expect(
      dialog.getByRole("combobox", { name: "Project (required)" }),
    ).toHaveValue(projectName);
    await expect(
      dialog.getByRole("combobox", { name: "Task (required)" }),
    ).toHaveValue(data.task);
    await taskPage.addTime("8", data.comment);
    await expect(
      taskPage.toast("Time Entry submitted successfully"),
    ).toBeVisible();

    await taskPage.openTaskDetails(data.task);
    // An employee's popup has no "Time entries" heading; it lists their own entries under the range.
    const popup = taskPage.popup(data.task);
    await expect(popup).toContainText("Last 15 days");
    await expect(popup).toContainText("08:00");
    await expect(popup).toContainText(data.comment);
  });

  test("TC189: An Employee is offered only Edit on a task someone else owns, and Delete as well on a task they added", async ({
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC189");
    const projectName = data.payloadCreateProject.project_name;
    await seedTask(projectId, data.othersTask);

    await openProjectList(data, projectId);
    await taskPage.openAddTask();
    await taskPage.fillTask({
      project: projectName,
      subject: data.ownTask,
      hours: "1",
      description: data.description,
    });
    await taskPage.submitButton.click();
    await expect(taskPage.toast("Task created successfully")).toBeVisible();

    const menuItems = taskPage.page.getByRole("menuitem");
    await taskPage.openRowMenu(data.othersTask);
    await expect(menuItems).toHaveText(["Edit"]);
    await taskPage.page.keyboard.press("Escape");
    await expect(menuItems).toHaveCount(0);

    await taskPage.openRowMenu(data.ownTask);
    await expect(menuItems).toHaveText(["Edit", "Delete"]);
  });

  test("TC191: The task popup shows an Employee only their own time entries", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Task");
    const { data, projectId } = await loadTestCase(jsonDir, "TC191");
    const task = data.payloadCreateTask.subject;
    const noTimeTask = `${task} without time`;
    const colleague = (await getDocument("Employee", process.env.EMP3_ID))
      .employee_name;
    await seedTask(projectId, noTimeTask);

    await openProjectList(data, projectId);
    await taskPage.openTaskDetails(task);
    const popup = taskPage.popup(task);
    await expect(popup).toContainText("Last 15 days");
    await expect(popup).toContainText("02:00");
    await expect(popup).toContainText("time of the first employee");
    await expect(popup).not.toContainText("03:00");
    await expect(popup).not.toContainText("time of the second employee");
    await expect(popup).not.toContainText(colleague);

    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();

    await taskPage.openTaskDetails(noTimeTask);
    await expect(taskPage.popup(noTimeTask)).toContainText(
      "No time logs found for the selected date range.",
    );
  });
});
