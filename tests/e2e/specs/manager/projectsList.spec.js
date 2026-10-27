const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { ColumnSettings } from "../../pageObjects/columnSettings";
import { ProjectsListPage } from "../../pageObjects/projectsListPage";

// TC299 seeds every "E2E Prj ..." project these cases read; see data/manager/projects.js.
const SEARCH = "E2E Prj";
const RED = "E2E Prj Red";
const AMBER = "E2E Prj Amber";
const GREEN = "E2E Prj Green";
const LIST_API = "get_projects_view";

test.describe("Manager: Projects list", () => {
  /** @type {ProjectsListPage} */ let list;

  test.beforeEach(async ({ page }) => {
    list = new ProjectsListPage(page);
  });

  /** Of the three colour-coded projects, the ones listed. */
  const coloured = async () =>
    (await list.names()).filter((name) => [RED, AMBER, GREEN].includes(name));

  test("TC300: The Projects list loads 20 projects at a time and loads more on scroll", async ({
    page,
  }) => {
    allure.story("Projects");
    const starts = [];
    page.on("request", (req) => {
      if (req.url().includes(LIST_API)) {
        starts.push(new URL(req.url()).searchParams.get("start"));
      }
    });
    await list.open({ search: SEARCH });
    await expect(list.projectListItems).toHaveCount(20);

    await expect
      .poll(async () => {
        await list.projectListItems.last().scrollIntoViewIfNeeded();
        await page.mouse.wheel(0, 2000);
        return list.projectListItems.count();
      })
      .toBeGreaterThan(20);
    expect(starts).toContain("20");
  });

  test("TC301: A search that matches no project shows 'No projects found.'", async () => {
    allure.story("Projects");
    await list.open({ search: `${SEARCH} no such project` });
    await expect(
      list.page.getByText("No projects found.", { exact: true }),
    ).toBeVisible();
    await expect(list.projectListItems).toHaveCount(0);
  });

  test("TC302: The RAG Status filter narrows the list", async ({ page }) => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    await list.pickRag(["Red"]);
    await expect(page).toHaveURL(/rag=/);
    await expect.poll(coloured).toEqual([RED]);
    await list.pickRag(["Amber"]);
    await expect.poll(coloured).toEqual([AMBER, RED]);
    // Projects with no RAG status drop out.
    expect(await list.names()).not.toContain("E2E Prj Page 01");
  });

  test("TC303: The Phases filter narrows the list", async ({ page }) => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    await list.choose(list.phaseSelect, "Development");
    await expect(page).toHaveURL(/phase=Development/);
    await expect.poll(() => list.names()).toEqual([AMBER]);
    await list.choose(list.phaseSelect, "Kick Off");
    await expect.poll(() => list.names()).toEqual([RED]);
  });

  test("TC304: The Status filter narrows the list", async ({ page }) => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    await list.choose(list.statusSelect, "Completed");
    await expect(page).toHaveURL(/status=Completed/);
    await expect.poll(() => list.names()).toEqual([GREEN]);

    await list.open({ search: GREEN });
    await list.choose(list.statusSelect, "Open");
    await expect(
      list.page.getByText("No projects found.", { exact: true }),
    ).toBeVisible();
    await list.open({ search: RED, status: "Open" });
    await expect.poll(() => list.names()).toEqual([RED]);
  });

  test("TC305: The Filter panel narrows the list by Customer or Project Manager, and Not Equals leaves the chosen one out", async () => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    await list.addFilterCondition("Customer", "QA-USD");
    await expect.poll(() => list.names()).toEqual([AMBER]);

    // Not Equals keeps every other customer's project and drops the chosen one's.
    await list.open({ search: RED });
    await list.addFilterCondition("Customer", "QA-USD", false, "Not Equals");
    await expect.poll(() => list.names()).toEqual([RED]);
    await list.open({ search: AMBER });
    await list.addFilterCondition("Customer", "QA-USD", false, "Not Equals");
    await expect(list.noResultsCell).toBeVisible();

    await list.open({ search: SEARCH });
    await list.addFilterCondition("Project Manager", process.env.REP_MAN_NAME);
    await expect.poll(() => list.names()).toEqual([RED]);
  });

  test("TC306: The Filter button counts search, RAG, Phases, Status and panel conditions, and Clear all filters removes them", async ({
    page,
  }) => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    await expect.poll(() => list.filterCount()).toBe(1);
    await list.pickRag(["Red"]);
    await expect.poll(() => list.filterCount()).toBe(2);
    await list.choose(list.phaseSelect, "Kick Off");
    await expect.poll(() => list.filterCount()).toBe(3);
    await list.choose(list.statusSelect, "Open");
    await expect.poll(() => list.filterCount()).toBe(4);
    await list.addFilterCondition("Customer", "QA-INR");
    await expect.poll(() => list.filterCount()).toBe(5);
    await expect.poll(() => list.names()).toEqual([RED]);

    await list.clearAll();
    await expect.poll(() => list.filterCount()).toBe(0);
    await expect(page).not.toHaveURL(/[?&](search|rag|phase|status|advanced)=/);
    await expect(list.searchBar).toHaveValue("");
  });

  test("TC307: Search, RAG, Phases, Status and panel conditions survive a reload and a direct URL", async ({
    page,
  }) => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    await list.pickRag(["Red"]);
    await list.choose(list.phaseSelect, "Kick Off");
    await list.choose(list.statusSelect, "Open");
    await list.addFilterCondition("Customer", "QA-INR");
    await expect.poll(() => list.names()).toEqual([RED]);
    const url = page.url();

    await page.reload();
    await expect.poll(() => list.names()).toEqual([RED]);
    await expect(list.searchBar).toHaveValue(SEARCH);
    await expect(list.phaseSelect).toHaveText("Kick Off");
    await expect(list.statusSelect).toHaveText("Open");
    expect(await list.filterCount()).toBe(5);

    const fresh = new ProjectsListPage(await page.context().newPage());
    try {
      await fresh.page.goto(url);
      await expect.poll(() => fresh.names()).toEqual([RED]);
      expect(await fresh.filterCount()).toBe(5);
    } finally {
      await fresh.page.close();
    }
  });

  test("TC308: The Columns menu hides and adds columns, and Reset to Default restores the layout", async () => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    const defaults = await list.headers();
    const columns = new ColumnSettings(list.page);

    await columns.removeColumn("Phase");
    await expect.poll(() => list.headers()).not.toContain("Phase");
    await columns.addColumn("Project type");
    await expect.poll(() => list.headers()).toContain("Project type");
    await expect(list.page).toHaveURL(/columnOrder=/);

    await columns.open();
    await columns.panel.getByText("Reset to Default", { exact: true }).click();
    await columns.close();
    await expect.poll(() => list.headers()).toEqual(defaults);
  });

  test("TC309: Up to three columns can be pinned, and a fourth pin is refused", async ({
    page,
  }) => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    for (const label of ["Phase", "Start date", "End date"]) {
      await list.pinColumn(label);
    }
    await expect(page).toHaveURL(
      /pinned=[^&]+%2C[^&]+%2C[^&]+|pinned=[^&]+,[^&]+,[^&]+/,
    );
    const pinned = new URL(page.url()).searchParams.get("pinned");

    await list.columnOptions("Client name").click();
    const fourth = page.getByRole("menuitem", { name: "Pin column" });
    await fourth.hover();
    await expect(page.getByText("You can pin up to 3 columns")).toBeVisible();
    await fourth.click({ force: true });
    await page.keyboard.press("Escape");
    expect(new URL(page.url()).searchParams.get("pinned")).toBe(pinned);
  });

  test("TC310: A column header sorts the list, a second click reverses it, and Clear sort returns to Last Updated On", async ({
    page,
  }) => {
    allure.story("Projects");
    await list.open({ search: SEARCH });
    await list.clickHeader("Project name");
    await expect.poll(() => list.sortState("Project name")).toBe("descending");
    await expect(page).toHaveURL(/sortOrder=desc/);
    const descending = await list.projectOrder();
    expect(descending).toEqual([...descending].sort().reverse());

    await list.clickHeader("Project name");
    await expect.poll(() => list.sortState("Project name")).toBe("ascending");
    const ascending = await list.projectOrder();
    expect(ascending).toEqual([...ascending].sort());

    await list.openSortMenu();
    await list.sortPanel.getByRole("button", { name: "Clear sort" }).click();
    await expect(page).not.toHaveURL(/sortField=/);
    await expect(list.sortButton).toContainText("Last Updated On");
  });
});
