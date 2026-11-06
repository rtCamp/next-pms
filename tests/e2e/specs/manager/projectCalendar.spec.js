const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { ProjectCalendarPage } from "../../pageObjects/projectCalendarPage";
import {
  deleteDocument,
  getDocList,
  getDocument,
  updateDocument,
} from "../../utils/api/apiClient";
import { getFormattedDate } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";

// TC299 seeds a milestone (3 to 5 days ahead) and a touchpoint (4 days ahead) on
// "E2E Prj Detail"; see data/manager/projects.js.
const MILESTONE = "E2E Prj milestone";
const TOUCHPOINT = "E2E Prj touchpoint";
const ITEM = "Project Timeline Item";
const DAY = 24 * 60 * 60 * 1000;
const daysAhead = (days) => getFormattedDate(new Date(Date.now() + days * DAY));
/** "Oct 23", as the list prints a date. */
const short = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

// Some cases edit the seeded milestone, so they run in order and put it back.
test.describe.configure({ mode: "serial" });

test.describe("Manager: Project calendar", () => {
  /** @type {ProjectCalendarPage} */ let calendar;
  let data;
  let project;

  test.beforeEach(async ({ page, jsonDir }) => {
    calendar = new ProjectCalendarPage(page);
    data = (await readJSONFile(path.join(jsonDir, "TC299.json"))).TC299;
    project = data.payloadDeleteProject5.projectId;
    await updateDocument(ITEM, data.docs.milestone, {
      title: MILESTONE,
      is_complete: 0,
      actual_end_date: null,
    });
  });

  const removeItems = async (title) => {
    for (const { name } of await getDocList(ITEM, [["title", "=", title]])) {
      await deleteDocument(ITEM, name);
    }
  };

  const milestoneStart = () =>
    getDocument(ITEM, data.docs.milestone).then((doc) => doc.start_date);

  test("TC334: The Calendar shows the project's milestones and touchpoints", async () => {
    allure.story("Projects");
    await calendar.goto(project);
    await calendar.showMonth(await milestoneStart());
    await expect(calendar.entry(MILESTONE)).toBeVisible();
    await expect(calendar.entry(TOUCHPOINT)).toBeVisible();
  });

  test("TC335: The Calendar, Gantt and List switcher shows each view", async ({
    page,
  }) => {
    allure.story("Projects");
    await calendar.goto(project);
    await calendar.showMonth(await milestoneStart());
    await expect(calendar.entry(MILESTONE)).toBeVisible();

    await calendar.view("Gantt").click();
    await expect(page).toHaveURL(/view=gantt/);
    await calendar.showMonth(await milestoneStart());
    await expect(calendar.entry(MILESTONE)).toBeVisible();

    await calendar.view("List").click();
    await expect(page).toHaveURL(/view=list/);
    await expect(calendar.listRow(MILESTONE)).toBeVisible();
  });

  test("TC336: Previous, Next and Today move the Calendar by a month and back", async () => {
    allure.story("Projects");
    const month = (offset) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() + offset);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    };
    await calendar.goto(project);
    await expect(calendar.monthLabel).toHaveText(month(0));
    await calendar.nextButton.click();
    await expect(calendar.monthLabel).toHaveText(month(1));
    await calendar.previousButton.click();
    await calendar.previousButton.click();
    await expect(calendar.monthLabel).toHaveText(month(-1));
    await calendar.todayButton.click();
    await expect(calendar.monthLabel).toHaveText(month(0));
  });

  test("TC337: The type filter narrows the Calendar, and hovering an entry shows its card", async ({
    page,
  }) => {
    allure.story("Projects");
    await calendar.goto(project);
    await calendar.showMonth(await milestoneStart());
    await calendar.chooseType("Milestones");
    await expect(calendar.entry(MILESTONE)).toBeVisible();
    await expect(calendar.entry(TOUCHPOINT)).toHaveCount(0);
    await calendar.chooseType("Touchpoints");
    await expect(calendar.entry(TOUCHPOINT)).toBeVisible();
    await expect(calendar.entry(MILESTONE)).toHaveCount(0);

    await calendar.chooseType("All");
    await calendar.entry(MILESTONE).hover();
    const card = page.locator("[data-side]:visible").last();
    await expect(card).toContainText(MILESTONE);
    // Title and type; the ToDo count shows only when the milestone has ToDos.
    await expect(card).toContainText("Other");
  });

  test("TC338: Create milestone asks for a name and an owner, and refuses a completion date before the start", async ({
    page,
  }) => {
    allure.story("Projects");
    const posted = [];
    page.on("request", (req) => {
      if (req.url().includes("create_project_timeline_item"))
        posted.push(req.url());
    });
    await calendar.goto(project);
    await calendar.createButton.click();
    await calendar.submitItem();
    await expect(
      calendar.message("Please enter a milestone name."),
    ).toBeVisible();
    await expect(calendar.message("Please select an owner.")).toBeVisible();

    await calendar.fillItem({
      name: "E2E Prj refused milestone",
      start: daysAhead(5),
      end: daysAhead(2),
      owner: process.env.REP_MAN_NAME,
    });
    await calendar.submitItem();
    await expect(
      calendar.message("Completion date must be on or after start date."),
    ).toBeVisible();
    expect(posted).toEqual([]);
  });

  test("TC339: A new milestone shows on the Calendar, Gantt and List views with its owner", async ({
    page,
  }) => {
    allure.story("Projects");
    // Creates, opens three views, then cleans up over the API.
    test.slow();
    const title = `E2E Prj new milestone ${Date.now()}`;
    const [start, end] = [daysAhead(6), daysAhead(8)];
    try {
      await calendar.goto(project);
      await calendar.createButton.click();
      await calendar.fillItem({
        name: title,
        start,
        end,
        owner: process.env.REP_MAN_NAME,
      });
      await calendar.submitItem();
      await expect(
        page.getByText("Milestone created successfully").first(),
      ).toBeVisible();

      await calendar.goto(project);
      await calendar.showMonth(start);
      await expect(calendar.entry(title)).toBeVisible();
      await calendar.goto(project, { view: "gantt" });
      await calendar.showMonth(start);
      await expect(calendar.entry(title)).toBeVisible();
      await calendar.gotoCalendarList(project, "milestones");
      await expect(calendar.listRow(title)).toContainText(
        process.env.REP_MAN_NAME,
      );
      await expect(calendar.listRow(title)).toContainText(short(end));
    } finally {
      await removeItems(title);
    }
  });

  test("TC340: Create touchpoint asks for a name and an owner, and the new touchpoint shows on the calendar", async ({
    page,
  }) => {
    allure.story("Projects");
    // Creates, opens three views, then cleans up over the API.
    test.slow();
    const title = `E2E Prj new touchpoint ${Date.now()}`;
    const day = daysAhead(7);
    try {
      await calendar.goto(project);
      await page
        .getByRole("button", { name: "Touchpoints", exact: true })
        .click();
      await calendar.createButton.click();
      await expect(calendar.itemDialog).toContainText("Create touchpoint");
      await calendar.submitItem();
      await expect(
        calendar.message("Please enter a touchpoint name."),
      ).toBeVisible();
      await expect(calendar.message("Please select an owner.")).toBeVisible();

      await calendar.fillItem({
        name: title,
        scheduled: day,
        owner: process.env.REP_MAN_NAME,
      });
      await calendar.submitItem();
      await expect(
        page.getByText("Touchpoint created successfully").first(),
      ).toBeVisible();
      await calendar.goto(project);
      await calendar.showMonth(day);
      await expect(calendar.entry(title)).toBeVisible();
    } finally {
      await removeItems(title);
    }
  });

  test("TC341: A milestone edited from its row menu keeps the change after a reload", async ({
    page,
  }) => {
    allure.story("Projects");
    const renamed = `${MILESTONE} edited`;
    await calendar.gotoCalendarList(project, "milestones");
    await calendar.chooseListAction(MILESTONE, "Edit");
    await expect(calendar.itemDialog).toContainText("Edit milestone");
    await calendar.fillItem({ name: renamed });
    await calendar.submitItem();
    await expect(
      page.getByText("Milestone updated successfully").first(),
    ).toBeVisible();

    await page.reload();
    await expect(calendar.listRow(renamed)).toBeVisible();
    expect((await getDocument(ITEM, data.docs.milestone)).title).toBe(renamed);
  });

  test("TC342: Mark as completed sets the Actual end date and Mark as incomplete clears it", async ({
    page,
  }) => {
    allure.story("Projects");
    await calendar.gotoCalendarList(project, "milestones");
    await calendar.chooseListAction(MILESTONE, "Mark as completed");
    await expect(page.getByText("Marked as completed").first()).toBeVisible();
    await expect
      .poll(
        async () =>
          (await getDocument(ITEM, data.docs.milestone)).actual_end_date,
      )
      .toBe(getFormattedDate(new Date()));
    await page.reload();
    await expect(calendar.listRow(MILESTONE)).toContainText(
      short(getFormattedDate(new Date())),
    );

    await calendar.chooseListAction(MILESTONE, "Mark as incomplete");
    await expect(page.getByText("Marked as incomplete").first()).toBeVisible();
    await expect
      .poll(
        async () =>
          (await getDocument(ITEM, data.docs.milestone)).actual_end_date,
      )
      .toBeFalsy();
  });
});
