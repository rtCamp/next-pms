const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { NotesPage } from "../../pageObjects/notesPage";
import {
  createDocument,
  deleteDocument,
  getDocList,
} from "../../utils/api/apiClient";
import { loadTestCase, notificationsFor } from "../../utils/testCase";
import { scaleTimeout } from "../../utils/timeouts";

const NOTE = "Project Status Update";
const TEMPLATE = "Project Status Update Template";
const SUBSCRIPTION = "PMS Project Update Subscription";

test.describe("Manager: Project Notes", () => {
  /** @type {NotesPage} */ let notesPage;

  test.beforeEach(async ({ page }) => {
    notesPage = new NotesPage(page);
  });

  const seedNote = (projectId, { title, body }) =>
    createDocument(NOTE, {
      project: projectId,
      title,
      description: `<p>${body}</p>`,
      status: "Publish",
    });

  const findNote = async (projectId, title) =>
    (
      await getDocList(
        NOTE,
        [
          ["project", "=", projectId],
          ["title", "=", title],
        ],
        { fields: ["name", "status", "description"] },
      )
    )[0];

  const subscriptions = (projectId, user) =>
    getDocList(
      SUBSCRIPTION,
      [
        ["project", "=", projectId],
        ["user", "=", user],
      ],
      { fields: ["name"] },
    );

  // Publishing queues the notification; the job that writes it runs on a
  // 15-minute cron, so only a site where it runs every minute can wait for it.
  const needsFastScheduler = () =>
    test.skip(
      !process.env.E2E_FAST_SCHEDULER,
      "Needs the deferred-insert job to run every minute (E2E_FAST_SCHEDULER=1)",
    );

  test("TC133: Create a note via notes/new and confirm it persists after reload", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Notes");
    const { data, projectId } = await loadTestCase(jsonDir, "TC133");

    await notesPage.goto(projectId);
    await notesPage.createNote({ title: data.title, body: data.body });

    await expect(notesPage.toast("Note saved")).toBeVisible();
    await expect(notesPage.card(data.title)).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(notesPage.card(data.title)).toBeVisible();
    await expect(page.getByText(data.body).first()).toBeVisible();

    const saved = await findNote(projectId, data.title);
    expect(saved).toMatchObject({ status: "Publish" });
    expect(saved.description).toContain(data.body);
  });

  test("TC134: Edit an existing note via notes/:noteId/edit and confirm the change persists", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Notes");
    const { data, projectId } = await loadTestCase(jsonDir, "TC134");
    const { name } = await seedNote(projectId, data);

    await notesPage.goto(projectId);
    await notesPage.editNote(data.title, data);
    await expect(page).toHaveURL(new RegExp(`tab=notes`));
    await expect(notesPage.toast("Note saved")).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(notesPage.card(data.newTitle)).toBeVisible();
    await expect(notesPage.card(data.title)).toHaveCount(0);

    const [saved] = await getDocList(NOTE, [["name", "=", name]], {
      fields: ["title", "description"],
    });
    expect(saved.title).toBe(data.newTitle);
    expect(saved.description).toContain(data.newBody);
    expect(saved.description).not.toContain(data.body);
  });

  test("TC135: Create and edit a note template via notes/templates/:templateId/edit", async ({
    jsonDir,
  }) => {
    allure.story("Notes");
    const { data, projectId } = await loadTestCase(jsonDir, "TC135");
    const readTemplate = async () =>
      (
        await getDocList(TEMPLATE, [["name", "=", data.templateTitle]], {
          fields: ["name", "description"],
        })
      )[0];

    // Templates are not tied to a project, so a leftover from a failed run
    // would block the create.
    await deleteDocument(TEMPLATE, data.templateTitle);
    try {
      await notesPage.goto(projectId);
      await notesPage.createTemplate({
        title: data.templateTitle,
        body: data.body,
      });
      await expect(notesPage.toast("Template saved")).toBeVisible();
      expect((await readTemplate()).description).toContain(data.body);

      await notesPage.gotoTemplateEdit(projectId, data.templateTitle);
      await expect(notesPage.editor).toContainText(data.body);
      await notesPage.appendToTemplate(data.addedText);
      await expect(notesPage.toast("Template updated")).toBeVisible();

      expect((await readTemplate()).description).toContain(
        data.body + data.addedText,
      );
    } finally {
      await deleteDocument(TEMPLATE, data.templateTitle);
    }
  });

  test("TC136: Subscribe and Unsubscribe button on the Notes tab toggles the state", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Notes");
    const { projectId } = await loadTestCase(jsonDir, "TC136");
    const user = process.env.REP_MAN_EMAIL;

    await notesPage.goto(projectId);
    await notesPage.subscriptionButton("Subscribe").click();
    await expect(notesPage.toast("Subscribed to project notes")).toBeVisible();
    await expect(notesPage.subscriptionButton("Unsubscribe")).toBeVisible();
    expect(await subscriptions(projectId, user)).toHaveLength(1);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(notesPage.subscriptionButton("Unsubscribe")).toBeVisible();

    await notesPage.subscriptionButton("Unsubscribe").click();
    await expect(
      notesPage.toast("Unsubscribed from project notes"),
    ).toBeVisible();
    await expect(notesPage.subscriptionButton("Subscribe")).toBeVisible();
    expect(await subscriptions(projectId, user)).toHaveLength(0);
  });

  test("TC137: Publishing a note sends one in-app notification to each subscriber and the Account Manager", async ({
    jsonDir,
  }) => {
    allure.story("Notes");
    needsFastScheduler();
    test.setTimeout(scaleTimeout(240000));
    const { data, projectId } = await loadTestCase(jsonDir, "TC137");
    const subscriber = process.env.EMP_EMAIL;
    const accountManager = process.env.EMP2_EMAIL;
    await createDocument(SUBSCRIPTION, {
      project: projectId,
      user: subscriber,
    });

    await notesPage.goto(projectId);
    await notesPage.createNote({ title: data.title, body: data.body });
    await expect(notesPage.toast("Note saved")).toBeVisible();
    const { name } = await findNote(projectId, data.title);

    for (const user of [subscriber, accountManager]) {
      await expect
        .poll(async () => (await notificationsFor(user, NOTE, name)).length, {
          timeout: scaleTimeout(60000),
          intervals: [5000],
        })
        .toBe(1);
      const [notification] = await notificationsFor(user, NOTE, name);
      expect(notification.label).toContain(data.title);
    }
  });

  test("TC138: The author is not notified, and editing or commenting does not notify again", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Notes");
    needsFastScheduler();
    test.setTimeout(scaleTimeout(360000));
    const { data, projectId } = await loadTestCase(jsonDir, "TC138");
    const author = process.env.REP_MAN_EMAIL;
    const subscriber = process.env.EMP_EMAIL;
    const accountManager = process.env.EMP2_EMAIL;
    // The author is subscribed too, which is the case the rule exists for.
    await createDocument(SUBSCRIPTION, { project: projectId, user: author });
    await createDocument(SUBSCRIPTION, {
      project: projectId,
      user: subscriber,
    });

    await notesPage.goto(projectId);
    await notesPage.createNote({ title: data.title, body: data.body });
    await expect(notesPage.toast("Note saved")).toBeVisible();
    const { name } = await findNote(projectId, data.title);
    const count = async (user) =>
      (await notificationsFor(user, NOTE, name)).length;

    await expect
      .poll(() => count(subscriber), {
        timeout: scaleTimeout(60000),
        intervals: [5000],
      })
      .toBe(1);
    expect(await count(accountManager)).toBe(1);
    expect(await count(author)).toBe(0);

    await notesPage.goto(projectId);
    await notesPage.editNote(data.title, {
      newTitle: data.title,
      newBody: data.newBody,
    });
    await expect(notesPage.toast("Note saved")).toBeVisible();
    await notesPage.gotoNote(projectId, name);
    await notesPage.comment(data.comment);
    await expect(page.getByText(data.comment)).toBeVisible();

    // Nothing is observable until the queue flushes again, so wait one full
    // cycle before checking that no second notification arrived.
    await page.waitForTimeout(scaleTimeout(70000));
    expect(await count(subscriber)).toBe(1);
    expect(await count(accountManager)).toBe(1);
    expect(await count(author)).toBe(0);
  });

  test("TC139: The Account Manager is auto-subscribed and cannot unsubscribe", async ({
    jsonDir,
  }) => {
    allure.story("Notes");
    const { projectId } = await loadTestCase(jsonDir, "TC139");

    await notesPage.goto(projectId);

    const subscribed = notesPage.subscriptionButton("Subscribed");
    await expect(subscribed).toBeVisible();
    await expect(subscribed).toBeDisabled();
    await expect(notesPage.subscriptionButton("Unsubscribe")).toHaveCount(0);
    await expect(notesPage.subscriptionButton("Subscribe")).toHaveCount(0);
  });

  test("TC140: @mentions in note comments still notify the mentioned user", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Notes");
    const { data, projectId } = await loadTestCase(jsonDir, "TC140");
    const { name } = await seedNote(projectId, data);
    const mentioned = process.env.EMP_EMAIL;
    const mentions = () =>
      getDocList(
        "Notification Log",
        [
          ["for_user", "=", mentioned],
          ["document_type", "=", NOTE],
          ["document_name", "=", name],
          ["type", "=", "Mention"],
        ],
        { fields: ["name", "subject"] },
      );

    try {
      await notesPage.gotoNote(projectId, name);
      await notesPage.commentWithMention({
        mention: process.env.EMP_NAME,
        text: data.comment,
      });
      await expect(page.getByText(data.comment)).toBeVisible();

      // Mentions are written by a background job, not the deferred queue.
      await expect
        .poll(async () => (await mentions()).length, {
          timeout: scaleTimeout(30000),
        })
        .toBe(1);
      expect((await mentions())[0].subject).toMatch(
        /mentioned you in .* note from .* project/,
      );
    } finally {
      // Notifications are not removed with the note.
      for (const { name: log } of await mentions()) {
        await deleteDocument("Notification Log", log);
      }
      for (const { name: row } of await getDocList(
        "NextPMS Notifications",
        [
          ["user", "=", mentioned],
          ["linked_document", "=", name],
        ],
        { fields: ["name"] },
      )) {
        await deleteDocument("NextPMS Notifications", row);
      }
    }
  });
});
