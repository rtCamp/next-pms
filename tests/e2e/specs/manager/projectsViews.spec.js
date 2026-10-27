const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { ProjectsListPage } from "../../pageObjects/projectsListPage";
import { request } from "@playwright/test";
import {
  baseURL,
  deleteDocument,
  getDocList,
  getDocument,
  loadAuthState,
  updateDocument,
} from "../../utils/api/apiClient";
import { readJSONFile } from "../../utils/fileUtils";

// TC299 seeds the views: one public and owned by Administrator, one private and the
// manager's. See data/manager/projects.js.
const PUBLIC_VIEW = "E2E Prj Public View";
const MY_VIEW = "E2E Prj My View";
const VIEW = "PMS View Setting";
const UPDATE_VIEW =
  "/api/method/next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view";

// The cases change the same two views, so they run in order; each puts them back first.
test.describe.configure({ mode: "serial" });

test.describe("Manager: Projects views", () => {
  /** @type {ProjectsListPage} */ let list;
  let myView;
  let publicView;
  let seededFilters;

  test.beforeEach(async ({ page, jsonDir }) => {
    list = new ProjectsListPage(page);
    const data = (await readJSONFile(path.join(jsonDir, "TC299.json"))).TC299;
    myView = String(data.payloadDeleteView2.viewId);
    publicView = String(data.payloadDeleteView.viewId);
    seededFilters = data.payloadCreateView2.filters;
    await updateDocument(VIEW, myView, {
      label: MY_VIEW,
      public: 0,
      // Making a view public blanks its user; a private view is listed by it.
      user: process.env.REP_MAN_EMAIL,
      filters: seededFilters,
    });
  });

  const removeViews = async (label) => {
    for (const { name } of await getDocList(VIEW, [["label", "=", label]])) {
      await deleteDocument(VIEW, String(name));
    }
  };

  test("TC311: A changed default view offers Create view; a changed saved view offers Save changes and Cancel, and Cancel restores it", async ({
    page,
  }) => {
    allure.story("Projects");
    await list.open({ search: "E2E Prj" });
    await expect(
      page.getByRole("button", { name: "Create view" }),
    ).toBeVisible();

    await list.openSavedView(MY_VIEW);
    await expect(page).toHaveURL(new RegExp(`view=${myView}`));
    await list.choose(list.phaseSelect, "Kick Off");
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page).not.toHaveURL(/phase=/);
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toHaveCount(0);
    await expect(list.searchBar).toHaveValue("E2E Prj");
  });

  test("TC312: Switching between saved views opens each one's list", async ({
    page,
  }) => {
    allure.story("Projects");
    await list.open();
    await list.openSavedView(MY_VIEW);
    await expect(page).toHaveURL(new RegExp(`view=${myView}`));
    expect(await list.openViewLabel()).toContain(MY_VIEW);
    await expect(list.searchBar).toHaveValue("E2E Prj");

    await list.openSavedView(PUBLIC_VIEW);
    await expect(page).toHaveURL(new RegExp(`view=${publicView}`));
    expect(await list.openViewLabel()).toContain(PUBLIC_VIEW);

    await list.openSavedView("List view");
    await expect(page).not.toHaveURL(
      new RegExp(`view=(${myView}|${publicView})`),
    );
  });

  test("TC313: Editing a saved view saves its new name and filters", async ({
    page,
  }) => {
    allure.story("Projects");
    const renamed = `${MY_VIEW} Edited`;
    await list.open();
    await list.openSavedView(MY_VIEW);
    await list.choose(list.phaseSelect, "Kick Off");
    await page.getByRole("button", { name: "Save changes" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit View" });
    await dialog.getByPlaceholder("View Name").fill(renamed);
    await dialog.getByRole("button", { name: "Update" }).click();
    await expect(
      page.getByText("View updated successfully").first(),
    ).toBeVisible();

    const saved = await getDocument(VIEW, myView);
    expect(saved.label).toBe(renamed);
    expect(saved.filters).toContain("Kick Off");
    await list.open();
    await list.openSavedView(renamed);
    await expect(page).toHaveURL(/phase=Kick/);
    await expect.poll(() => list.names()).toEqual(["E2E Prj Red"]);
  });

  test("TC314: Duplicate on a saved view creates a private copy called '<name> (Copy)'", async () => {
    allure.story("Projects");
    const copy = `${PUBLIC_VIEW} (Copy)`;
    await removeViews(copy);
    try {
      await list.open();
      await list.viewAction(PUBLIC_VIEW, "Duplicate");
      await expect(
        list.page.getByText("View Duplicated").first(),
      ).toBeVisible();
      const [made] = await getDocList(VIEW, [["label", "=", copy]], {
        fields: ["name", "public", "owner"],
      });
      expect(made).toMatchObject({
        public: 0,
        owner: process.env.REP_MAN_EMAIL,
      });
      await list.page.reload();
      await list.openViewMenu();
      await expect(list.viewMenuItem(copy)).toBeVisible();
    } finally {
      await removeViews(copy);
    }
  });

  test("TC315: Make Public turns a private view public", async () => {
    allure.story("Projects");
    await list.open();
    await list.viewAction(MY_VIEW, "Make Public");
    await expect(list.page.getByText("View Updated").first()).toBeVisible();
    await expect
      .poll(async () => (await getDocument(VIEW, myView)).public)
      .toBe(1);
    expect(await list.getViewRowActions(MY_VIEW)).toContain("Make Private");
  });

  test("TC316: A public view owned by someone else can only be duplicated; the owner's own view can be edited and deleted", async () => {
    allure.story("Projects");
    await list.open();
    expect(await list.getViewRowActions(PUBLIC_VIEW)).toEqual(["Duplicate"]);
    await list.open();
    expect((await list.getViewRowActions(MY_VIEW)).sort()).toEqual(
      ["Delete", "Duplicate", "Edit", "Make Public"].sort(),
    );

    // The server refuses it too.
    const context = await request.newContext({
      baseURL,
      storageState: loadAuthState("manager"),
    });
    try {
      const res = await context.post(UPDATE_VIEW, {
        data: { view: { name: publicView, label: "Renamed by another PM" } },
      });
      expect(res.status()).toBe(403);
      expect((await res.json())._server_messages).toContain(
        "Only Administrator or Owner can update public view",
      );
    } finally {
      await context.dispose();
    }
    expect((await getDocument(VIEW, publicView)).label).toBe(PUBLIC_VIEW);
  });
});
