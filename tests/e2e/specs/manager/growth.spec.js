const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { GrowthPage } from "../../pageObjects/growthPage";
import { createDocument, getDocList } from "../../utils/api/apiClient";
import { getFormattedDate } from "../../utils/dateUtils";
import { loadTestCase, notificationsFor } from "../../utils/testCase";
import { scaleTimeout } from "../../utils/timeouts";
import { getUploadFile } from "../../utils/uploadFiles";

test.describe("Manager: Project Growth", () => {
  /** @type {GrowthPage} */ let growthPage;

  test.beforeEach(async ({ page }) => {
    growthPage = new GrowthPage(page);
  });

  const seed = (projectId, fields) =>
    createDocument("PMS Growth Initiative", {
      project: projectId,
      status: "Ideation",
      ideation_date: getFormattedDate(new Date()),
      ...fields,
    });

  const read = async (name) =>
    (
      await getDocList("PMS Growth Initiative", [["name", "=", name]], {
        fields: [
          "name",
          "activity",
          "status",
          "is_closed",
          "closed_status",
          "client_priority",
          "activity_owner",
        ],
      })
    )[0];

  test("TC119: Growth tab appears on project details and loads its content", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC119");
    await seed(projectId, { activity: data.activity });

    await page.goto(`/next-pms/projects/${projectId}`, {
      waitUntil: "domcontentloaded",
    });
    await growthPage.growthTab.click();

    await expect(page).toHaveURL(/tab=growth/);
    await expect(growthPage.openHeading).toBeVisible();
    await expect(growthPage.closedHeading).toBeVisible();
    await expect(growthPage.createButton).toBeVisible();
    await expect(growthPage.item(data.activity)).toBeVisible();
    await expect.poll(() => growthPage.openCount()).toBe(1);
  });

  test("TC120: Growth initiative detail page opens from the Growth tab", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC120");
    const { name } = await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);
    await growthPage.openDetail(data.activity);

    await expect(page).toHaveURL(new RegExp(`growth=${name}`));
    await expect(
      page.getByRole("heading", { name: data.activity }),
    ).toBeVisible();
    for (const section of ["Additional documents", "Details", "Updates"]) {
      await expect(
        page.getByRole("heading", { name: section, exact: true }),
      ).toBeVisible();
    }

    await growthPage.backToList();
    await expect(growthPage.item(data.activity)).toBeVisible();
  });

  test("TC121: Create a growth initiative with all required fields; it appears in the Open list", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC121");

    await growthPage.goto(projectId);
    await expect.poll(() => growthPage.openCount()).toBe(0);
    await growthPage.create({
      activity: data.activity,
      status: "Ideation",
      description: data.description,
    });

    await expect(growthPage.toast("Growth initiative created")).toBeVisible();
    await expect(growthPage.item(data.activity)).toBeVisible();
    await expect.poll(() => growthPage.openCount()).toBe(1);

    const [created] = await getDocList(
      "PMS Growth Initiative",
      [["project", "=", projectId]],
      { fields: ["activity", "status"] },
    );
    expect(created).toMatchObject({
      activity: data.activity,
      status: "Ideation",
    });
  });

  test("TC122: Closing an initiative requires a closed status", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC122");
    const { name } = await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);
    await growthPage.openDetail(data.activity);
    await growthPage.addUpdateButton.click();
    await growthPage.choose("Status", "Closed");
    await growthPage
      .field("Note")
      .locator("[contenteditable]")
      .first()
      .fill("Closing without a closed status");

    await expect(growthPage.field("Closed status")).toBeVisible();
    await growthPage.dialog.getByRole("button", { name: "Add update" }).click();

    // Refused: the dialog stays open and the initiative is still open.
    await expect(growthPage.dialog).toBeVisible();
    expect(await read(name)).toMatchObject({
      status: "Ideation",
      is_closed: 0,
    });
  });

  test("TC123: A closed initiative moves from the Open list to the Closed list", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC123");
    const { name } = await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);
    await expect.poll(() => growthPage.openCount()).toBe(1);
    await growthPage.openDetail(data.activity);
    await growthPage.addUpdate({
      status: "Closed",
      closedStatus: "Won",
      note: data.note,
    });
    await expect(growthPage.dialog).toBeHidden();
    await growthPage.backToList();

    await expect.poll(() => growthPage.openCount()).toBe(0);
    await expect.poll(() => growthPage.closedCount()).toBe(1);
    await growthPage.expandClosed();
    await expect(growthPage.item(data.activity)).toBeVisible();
    expect(await read(name)).toMatchObject({
      status: "Closed",
      is_closed: 1,
      closed_status: "Won",
    });
  });

  test("TC124: Filter the initiatives table and confirm the results", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC124");
    await seed(projectId, {
      activity: data.activityIdeation,
      status: "Ideation",
    });
    await seed(projectId, {
      activity: data.activityInProgress,
      status: "In Progress",
    });

    await growthPage.goto(projectId);
    await expect(growthPage.item(data.activityIdeation)).toBeVisible();
    await expect(growthPage.item(data.activityInProgress)).toBeVisible();

    await growthPage.filterByStatus("In Progress");

    await expect(growthPage.item(data.activityInProgress)).toBeVisible();
    await expect(growthPage.item(data.activityIdeation)).toHaveCount(0);
  });

  test("TC125: Edit an initiative and confirm the change persists after reload", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC125");
    const { name } = await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);
    await growthPage.edit(data.activity, { newActivity: data.renamed });
    await expect(growthPage.item(data.renamed)).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(growthPage.item(data.renamed)).toBeVisible();
    await expect(growthPage.item(data.activity)).toHaveCount(0);
    expect((await read(name)).activity).toBe(data.renamed);
  });

  test("TC126: Delete an initiative and confirm it leaves the list", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC126");
    const { name } = await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);
    await growthPage.deleteFromList(data.activity);

    await expect(growthPage.item(data.activity)).toHaveCount(0);
    await expect.poll(() => growthPage.openCount()).toBe(0);
    expect(await read(name)).toBeUndefined();
  });

  // Reported this issue once it's resolved will remove the skip from this test.
  test.skip("TC127: Attachment upload rejects disallowed file types", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC127");
    await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);
    await growthPage.openDetail(data.activity);
    const file = getUploadFile("disallowed") ?? {
      name: "tc127-blocked.exe",
      mimeType: "application/x-msdownload",
      content: "MZ not really an executable",
    };
    await growthPage.uploadDocument(file);
    const listed = await growthPage.isDocumentListed(file.name);

    // Known bug rtCamp/next-pms#2270: any file type is accepted. Marked as an
    // expected failure only once the upload really was accepted, so a setup
    // error above cannot pass as the known bug. Starts passing once it is fixed.
    test.fail(listed, "Known bug #2270 - any file type is accepted");
    expect(listed, "a disallowed file type must not be accepted").toBe(false);
  });

  test("TC128: Follow and unfollow an initiative", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC128");
    const { name } = await seed(projectId, { activity: data.activity });
    const follows = () =>
      getDocList(
        "Document Follow",
        [
          ["ref_doctype", "=", "PMS Growth Initiative"],
          ["ref_docname", "=", name],
          ["user", "=", process.env.REP_MAN_EMAIL],
        ],
        { fields: ["name"] },
      );

    await growthPage.goto(projectId);
    await growthPage.openDetail(data.activity);

    await growthPage.openDetailMenu();
    await page.getByRole("menuitem", { name: "Follow", exact: true }).click();
    await expect.poll(async () => (await follows()).length).toBe(1);

    await growthPage.openDetailMenu();
    await page.getByRole("menuitem", { name: "Unfollow" }).click();
    await expect.poll(async () => (await follows()).length).toBe(0);
  });

  test("TC129: Add an update to the Updates timeline; it records the note with its status", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC129");
    const { name } = await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);
    await growthPage.openDetail(data.activity);
    await growthPage.addUpdate({ status: "In Progress", note: data.note });
    await expect(growthPage.dialog).toBeHidden();

    const updates = growthPage.section("Updates");
    await expect(updates).toContainText(data.note);
    await expect(updates).toContainText("In Progress");
    expect((await read(name)).status).toBe("In Progress");
  });

  test("TC130: Client priority is locked to the update log and cannot be edited directly", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Growth");
    const { data, projectId } = await loadTestCase(jsonDir, "TC130");
    const { name } = await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);

    // The edit dialog shows priority as read-only text, not a control.
    await growthPage.openRowMenu(data.activity);
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(growthPage.field("Priority for Client")).toBeVisible();
    await expect(
      growthPage.field("Priority for Client").getByRole("combobox"),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");

    // It changes only by posting an update.
    await growthPage.openDetail(data.activity);
    await growthPage.addUpdate({ priority: "High", note: data.note });
    await expect
      .poll(async () => (await read(name)).client_priority)
      .toBe("High");

    await growthPage.backToList();
    await growthPage.openRowMenu(data.activity);
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(growthPage.field("Priority for Client")).toContainText("High");
  });

  test.skip("TC131: Changing status or owner notifies the right people", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    // The notification is queued and written by a scheduled job that runs on a
    // 15-minute cron (frappe.deferred_insert.save_to_db), and nothing can trigger
    // it from here. Set E2E_FAST_SCHEDULER=1 on a site where that job runs
    // every minute; otherwise there is no way to observe the notification.
    test.skip(
      !process.env.E2E_FAST_SCHEDULER,
      "Needs the deferred-insert job to run every minute (E2E_FAST_SCHEDULER=1)",
    );
    test.setTimeout(scaleTimeout(240000));
    const { data, projectId } = await loadTestCase(jsonDir, "TC131");
    const { name } = await seed(projectId, { activity: data.activity });
    const owner = process.env.EMP_EMAIL;

    // A follower other than the person making the change hears about the status.
    await createDocument("Document Follow", {
      ref_doctype: "PMS Growth Initiative",
      ref_docname: name,
      user: owner,
    });

    await growthPage.goto(projectId);
    await growthPage.openRowMenu(data.activity);
    await growthPage.page.getByRole("menuitem", { name: "Edit" }).click();
    await growthPage.chooseUser("Activity owner", process.env.EMP_NAME);
    await growthPage.dialog
      .getByRole("button", { name: "Save", exact: true })
      .click();
    await expect(growthPage.dialog).toBeHidden();

    await growthPage.openDetail(data.activity);
    await growthPage.addUpdate({ status: "In Progress", note: "Status moved" });
    await expect(growthPage.dialog).toBeHidden();

    await expect
      .poll(
        async () => {
          const labels = (
            await notificationsFor(owner, "PMS Growth Initiative", name)
          )
            .map((n) => n.label)
            .join(" | ");

          return {
            assigned: /assigned you the growth initiative/.test(labels),
            status: /updated the growth initiative status to In Progress/.test(
              labels,
            ),
          };
        },
        { timeout: scaleTimeout(60000), intervals: [5000] },
      )
      .toEqual({ assigned: true, status: true });
  });

  test("TC132: Upload and list files in the Additional documents area of an initiative", async ({
    jsonDir,
  }) => {
    allure.story("Growth");
    const file = getUploadFile("valid");
    test.skip(!file, "Paste a file into tests/e2e/data/upload-files/valid");
    const { data, projectId } = await loadTestCase(jsonDir, "TC132");
    await seed(projectId, { activity: data.activity });

    await growthPage.goto(projectId);
    await growthPage.openDetail(data.activity);
    await growthPage.uploadDocument({
      name: "tc132-notes.txt",
      mimeType: "text/plain",
      content: "Growth initiative notes",
    });

    await expect(growthPage.documentLink("tc132-notes.txt")).toBeVisible();
    await expect(growthPage.section("Additional documents")).toContainText(
      "TXT",
    );
  });
});
