const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { signedInContext } from "../../helpers/storageStateHelper";
import { weekStatuses } from "../../helpers/weekTimeHelper";
import { GrowthPage } from "../../pageObjects/growthPage";
import { NavigationPage } from "../../pageObjects/navigationPage";
import { NotesPage } from "../../pageObjects/notesPage";
import { ProjectRisksPage } from "../../pageObjects/projectRisksPage";
import { TeamTimesheetPage } from "../../pageObjects/teamTimesheetPage";
import {
  createDocument,
  deleteDocument,
  getDocList,
} from "../../utils/api/apiClient";
import { apiRequest } from "../../utils/api/timesheetRequests";
import { getFormattedDate, weekLabel } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";
import { findProjectId } from "../../utils/testCase";
import { scaleTimeout } from "../../utils/timeouts";

// TC388 (data/manager/access.js) seeds one login user per role and a project to open.
const FIXTURE = "TC388";
const MANAGER = process.env.REP_MAN_EMAIL;

const DASHBOARDS = [
  ["/dashboard/leadership", "Leadership Dashboard"],
  ["/dashboard/manager", "Manager Dashboard"],
];
const REVIEW = [
  ["/timesheet/team", "Team Timesheet"],
  ["/timesheet/project", "Project Timesheet"],
];
const ALLOCATIONS = [
  ["/allocations/team", "Team Allocations"],
  ["/allocations/project", "Project Allocations"],
];
const NOT_FIELDS = new Set([
  "Section Break",
  "Column Break",
  "Tab Break",
  "HTML",
  "Button",
  "Heading",
  "Image",
]);

test.describe("Access & Roles", () => {
  // Five of these started together and logged in several users on a loaded run: 90s was
  // too tight, while each passes in under 50s when the server is quiet.
  test.describe.configure({ timeout: scaleTimeout(60000) });
  let data;
  let projectId;

  test.beforeAll(async ({ jsonDir }) => {
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
    projectId = await findProjectId(data.payloadCreateProject);
  });

  /** Runs `body` signed in as a seeded user, in a session of its own. */
  const signedInAs = async (browser, user, name, body) => {
    const context = await signedInContext(browser, user, `access-${name}`);
    try {
      const page = await context.newPage();
      await body({ context, page, nav: new NavigationPage(page) });
    } finally {
      await context.close();
    }
  };
  const persona = (key) => data.employees[key].user;

  /** Every route in `routes` opens for the user. */
  const reaches = async (nav, routes) => {
    for (const [route, title] of routes) {
      await nav.visit(route);
      await nav.expectReached(title);
    }
  };

  /**
   * The Project fields at permission levels 1 to `maxLevel` that hold a value. A field the
   * user may not read still comes back, as null, so only a value tells the two apart.
   */
  const guardedValues = async (maxLevel) => {
    const meta = await apiRequest(
      "/api/method/frappe.desk.form.load.getdoctype?doctype=Project",
      { method: "GET" },
      "admin",
    );
    const { fields } = (meta.docs ?? meta.message.docs).find(
      (doc) => doc.name === "Project",
    );
    const guarded = fields.filter(
      (field) =>
        field.permlevel > 0 &&
        field.permlevel <= maxLevel &&
        !NOT_FIELDS.has(field.fieldtype),
    );
    const { data } = await apiRequest(
      `/api/resource/Project/${encodeURIComponent(projectId)}`,
      { method: "GET" },
      "admin",
    );
    const held = (value) =>
      Array.isArray(value)
        ? value.length > 0
        : ![null, undefined, "", 0].includes(value);
    return Object.fromEntries(
      guarded
        .filter((field) => held(data[field.fieldname]))
        .map((field) => [field.fieldname, data[field.fieldname]]),
    );
  };

  /** The signed-in user reads every value that `guardedValues` found. */
  const expectGuardedValues = async (context, maxLevel) => {
    const expected = await guardedValues(maxLevel);
    expect(Object.keys(expected).length).toBeGreaterThan(0);
    const seen = await projectAs(context);
    for (const [field, value] of Object.entries(expected)) {
      expect(seen[field], field).toEqual(value);
    }
  };

  /** The project document as the signed-in user may read it. */
  const projectAs = async (context) => {
    const res = await context.request.get(
      `/api/resource/Project/${encodeURIComponent(projectId)}`,
    );
    expect(res.ok(), `read the project: ${res.status()}`).toBe(true);
    return (await res.json()).data;
  };

  test("TC391: A user with no Employee record lands on the Access Restricted page", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    await signedInAs(
      browser,
      data.users.AcNoEmployee,
      "none",
      async ({ page, nav }) => {
        await nav.visit("/timesheet");
        await expect(page).toHaveURL(/\/next-pms\/no-employee/, {
          timeout: scaleTimeout(40000),
        });
        await expect(nav.noEmployeeHeading).toBeVisible();
        await expect(
          page.getByText("You are not an employee in this company."),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Log out" }),
        ).toBeVisible();
      },
    );
  });

  test("TC392: Opening a Next PMS page without a session goes to the login page", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    const context = await browser.newContext({
      baseURL: process.env.BASE_URL,
      storageState: { cookies: [], origins: [] },
    });
    try {
      const page = await context.newPage();
      for (const route of [
        "/next-pms/timesheet",
        "/next-pms/dashboard/manager",
      ]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page, route).toHaveURL(/\/login/, {
          timeout: scaleTimeout(40000),
        });
        await expect(
          page.getByRole("textbox", { name: "Password" }),
        ).toBeVisible();
      }
    } finally {
      await context.close();
    }
  });

  test("TC393: A System Manager reaches both dashboards, Projects with its financial fields, Team and Project timesheets and Allocations", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    await signedInAs(
      browser,
      persona("AcSysMgr"),
      "sysmgr",
      async ({ context, nav }) => {
        await nav.goto("/timesheet");
        await expect(nav.sectionHeading("Dashboards")).toBeVisible();
        await expect(nav.sectionHeading("Timesheet")).toBeVisible();
        await expect(nav.link("/projects")).toBeVisible();

        await reaches(nav, [
          ...DASHBOARDS,
          ["/projects", "Projects"],
          ...REVIEW,
          ...ALLOCATIONS,
        ]);

        await expectGuardedValues(context, 3);
      },
    );
  });

  test("TC394: A Delivery Manager reaches both dashboards and Projects, with the financial fields up to permission level 2", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    await signedInAs(
      browser,
      persona("AcDelMgr"),
      "delmgr",
      async ({ context, nav }) => {
        await nav.goto("/timesheet");
        await expect(nav.sectionHeading("Dashboards")).toBeVisible();
        await expect(nav.link("/projects")).toBeVisible();

        await reaches(nav, [...DASHBOARDS, ["/projects", "Projects"]]);

        await expectGuardedValues(context, 2);
      },
    );
  });

  test("TC395: A Timesheet Manager reaches both dashboards and posts a project status update", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    const title = `E2E Access status ${Date.now()}`;
    await signedInAs(
      browser,
      persona("AcTsMgr"),
      "tsmgr",
      async ({ page, nav }) => {
        await nav.goto("/timesheet");
        await reaches(nav, DASHBOARDS);

        const notes = new NotesPage(page);
        await notes.goto(projectId);
        await notes.createNote({
          title,
          body: "Posted by a Timesheet Manager.",
        });
        await expect(notes.toast("Note saved")).toBeVisible();
        await expect(notes.card(title)).toBeVisible();

        const [saved] = await getDocList(
          "Project Status Update",
          [
            ["project", "=", projectId],
            ["title", "=", title],
          ],
          { fields: ["name", "status"] },
        );
        try {
          expect(saved?.status).toBe("Publish");
        } finally {
          if (saved) await deleteDocument("Project Status Update", saved.name);
        }
      },
    );
  });

  test("TC396: A Timesheet User opens the Team timesheet and approves a member's week", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    test.setTimeout(180000);
    const member = data.employees.AcMember;
    await signedInAs(
      browser,
      persona("AcTsUser"),
      "tsuser",
      async ({ page, nav }) => {
        await nav.goto("/timesheet");
        await expect(nav.link("/timesheet/team")).toBeVisible();
        await expect(nav.link("/timesheet/project")).toBeVisible();

        const team = new TeamTimesheetPage(page);
        await team.goto({ search: member.name });
        await team.approve(weekLabel(1), member.name);
        await expect(
          team.toast("Timesheet approval or rejection has been queued"),
        ).toBeVisible();

        await expect
          .poll(
            async () => {
              const statuses = await weekStatuses(data, "AcMember", 1);
              return (
                statuses.length > 0 &&
                statuses.every((status) => status === "Approved")
              );
            },
            { timeout: 90000, intervals: [3000] },
          )
          .toBe(true);
      },
    );
  });

  const label = (kind, who, stamp) => `E2E Access ${kind} ${who} ${stamp}`;
  const seedRisk = (summary, owner) =>
    createDocument("Risk", {
      project: projectId,
      risk_category: "Design",
      risk_level: "Medium",
      status: "To-do",
      summary,
      risk_owner: owner,
    });
  const seedGrowth = (activity, owner) =>
    createDocument("PMS Growth Initiative", {
      project: projectId,
      status: "Ideation",
      ideation_date: getFormattedDate(new Date()),
      activity,
      activity_owner: owner,
    });

  /** The menu entries a row offers, Follow aside (everyone has it); none when it has no menu. */
  const offered = async (page, row) => {
    await expect(row).toBeVisible();
    const trigger = row.locator("button[aria-haspopup='menu']");
    if ((await trigger.count()) === 0) return [];
    await trigger.last().click();
    const items = await page.getByRole("menuitem").allInnerTexts();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menuitem")).toHaveCount(0);
    return items.filter((item) => item !== "Follow");
  };

  test("TC397: A Timesheet Manager sees Edit and Delete on a risk and a growth initiative that someone else owns", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    const stamp = Date.now();
    const docs = [
      ["Risk", await seedRisk(label("risk", "other", stamp), MANAGER)],
      [
        "PMS Growth Initiative",
        await seedGrowth(label("growth", "other", stamp), MANAGER),
      ],
    ];
    try {
      await signedInAs(
        browser,
        persona("AcTsMgr"),
        "tsmgr-risks",
        async ({ page }) => {
          const risks = new ProjectRisksPage(page);
          await risks.goto(projectId);
          expect(
            await offered(page, risks.listRow(label("risk", "other", stamp))),
          ).toEqual(["Edit", "Delete"]);

          const growth = new GrowthPage(page);
          await growth.goto(projectId);
          expect(
            await offered(page, growth.row(label("growth", "other", stamp))),
          ).toEqual(["Edit", "Delete"]);
        },
      );
    } finally {
      for (const [doctype, doc] of docs)
        await deleteDocument(doctype, doc.name);
    }
  });

  test("TC398: A Projects Manager without the leadership roles is sent away from the Leadership dashboard but reaches the Manager dashboard", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    await signedInAs(
      browser,
      persona("AcProjMgr"),
      "projmgr",
      async ({ nav }) => {
        await nav.goto("/timesheet");
        await expect(nav.link("/dashboard/manager")).toBeVisible();
        await expect(nav.link("/dashboard/leadership")).toHaveCount(0);

        await nav.visit("/dashboard/leadership");
        await nav.expectNotFound();
        await reaches(nav, [["/dashboard/manager", "Manager Dashboard"]]);
      },
    );
  });

  test("TC399: A Projects User can edit a risk or growth initiative only when they own it and is never offered Delete; a Projects Manager can edit and delete any", async ({
    browser,
  }) => {
    allure.story("Access & Roles");
    const stamp = Date.now();
    const mine = persona("AcProjUser").email;
    const docs = [
      ["Risk", await seedRisk(label("risk", "own", stamp), mine)],
      ["Risk", await seedRisk(label("risk", "other", stamp), MANAGER)],
      [
        "PMS Growth Initiative",
        await seedGrowth(label("growth", "own", stamp), mine),
      ],
      [
        "PMS Growth Initiative",
        await seedGrowth(label("growth", "other", stamp), MANAGER),
      ],
    ];
    const menus = async (page) => {
      const risks = new ProjectRisksPage(page);
      await risks.goto(projectId);
      const seen = {
        riskOwn: await offered(
          page,
          risks.listRow(label("risk", "own", stamp)),
        ),
        riskOther: await offered(
          page,
          risks.listRow(label("risk", "other", stamp)),
        ),
      };
      const growth = new GrowthPage(page);
      await growth.goto(projectId, { canCreate: false });
      seen.growthOwn = await offered(
        page,
        growth.row(label("growth", "own", stamp)),
      );
      seen.growthOther = await offered(
        page,
        growth.row(label("growth", "other", stamp)),
      );
      return seen;
    };

    try {
      await signedInAs(
        browser,
        persona("AcProjUser"),
        "projuser",
        async ({ page }) => {
          expect(await menus(page)).toEqual({
            riskOwn: ["Edit"],
            riskOther: [],
            growthOwn: ["Edit"],
            growthOther: [],
          });
        },
      );
      await signedInAs(
        browser,
        persona("AcProjMgr"),
        "projmgr-owned",
        async ({ page }) => {
          expect(await menus(page)).toEqual({
            riskOwn: ["Edit", "Delete"],
            riskOther: ["Edit", "Delete"],
            growthOwn: ["Edit", "Delete"],
            growthOther: ["Edit", "Delete"],
          });
        },
      );
    } finally {
      for (const [doctype, doc] of docs)
        await deleteDocument(doctype, doc.name);
    }
  });
});
