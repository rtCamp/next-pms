const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { reseedAllocations } from "../../helpers/weekTimeHelper";
import { AllocationsPage } from "../../pageObjects/resourceManagement/allocations";
import { getDocList } from "../../utils/api/apiClient";
import { deleteAllocation } from "../../utils/api/resourceManagementRequests";
import { dateInWeek } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";

// TC265 seeds the members, projects and allocations; see data/manager/allocations.js.
const FIXTURE = "TC265";
const ALPHA = "E2E Alloc Alpha";
const EMP3 = process.env.EMP3_NAME;
const EMP2 = process.env.EMP2_NAME;

// EMP2, EMP3 and the seeded members are shared by these cases, so they run one at a time;
// each puts back what it changes.
test.describe.configure({ mode: "serial" });

test.describe("Manager: Allocations team actions", () => {
  /** @type {AllocationsPage} */ let al;
  let data;
  let member;
  let alpha;

  test.beforeEach(async ({ page, jsonDir }) => {
    al = new AllocationsPage(page);
    data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
    member = Object.fromEntries(
      Object.entries(data.employees).map(([key, { name }]) => [key, name]),
    );
    alpha = data.payloadDeleteProject.projectId;
  });

  /** Removes an employee's Alpha allocations that start within [from, to]. */
  const clearAlpha = async (employee, from, to) => {
    for (const { name } of await getDocList("Resource Allocation", [
      ["employee", "=", employee],
      ["project", "=", alpha],
      ["allocation_start_date", "between", [from, to]],
    ])) {
      await deleteAllocation(name);
    }
  };

  const toast = (text) => al.page.getByText(text).first();

  test("TC276: A recurring allocation books the same days in each repeated week", async () => {
    allure.story("Allocations");
    test.setTimeout(180000);
    const [from, to, last] = [
      dateInWeek(-7, "Mon"),
      dateInWeek(-7, "Fri"),
      dateInWeek(-8, "Sun"),
    ];
    await clearAlpha(process.env.EMP3_ID, from, last);
    try {
      await al.goto("team", { search: EMP3 });
      const before = await al.chips(EMP3).count();
      await al.addAllocatioButtton.first().click();
      await al.fillAllocation({
        employee: EMP3,
        project: ALPHA,
        from,
        to,
        hours: "1",
        repeatWeeks: 1,
      });
      await al.allocate();
      await expect(toast("Allocation created successfully")).toBeVisible();

      await expect
        .poll(async () => {
          await al.page.reload();
          await al.table.waitFor();
          return al.chips(EMP3).count();
        })
        .toBe(before + 2);
      const popover = await al.openChip(EMP3, before + 1);
      await expect(popover).toContainText(ALPHA);
      await expect(popover).toContainText(
        `${AllocationsPage.day(dateInWeek(-8, "Mon"))} – ${AllocationsPage.day(dateInWeek(-8, "Fri"))}`,
      );
      await expect(popover).toContainText("1h/day (5 hours)");
    } finally {
      await clearAlpha(process.env.EMP3_ID, from, last);
    }
  });

  test("TC277: Include weekends and Include holidays change the days counted in Total hours", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: EMP3 });
    await al.addAllocatioButtton.first().click();
    await al.fillAllocation({
      employee: EMP3,
      project: ALPHA,
      from: dateInWeek(-4, "Mon"),
      to: dateInWeek(-4, "Sun"),
      hours: "2",
    });
    // Monday to Friday of a week with no seeded leave: five days.
    await expect(al.totalHoursTextField).toHaveValue("10");
    // Weekends count once both are ticked, whether or not the site marks them as holidays.
    await al.dialog
      .getByRole("checkbox", { name: "Include weekends" })
      .check({ force: true });
    await al.dialog
      .getByRole("checkbox", { name: "Include holidays" })
      .check({ force: true });
    await expect(al.totalHoursTextField).toHaveValue("14");
    await al.dialog
      .getByRole("checkbox", { name: "Include weekends" })
      .uncheck({ force: true });
    await al.dialog
      .getByRole("checkbox", { name: "Include holidays" })
      .uncheck({ force: true });
    await expect(al.totalHoursTextField).toHaveValue("10");

    await al.dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(al.dialog).toBeHidden();
  });

  test("TC278: Allocating the same employee to the same project on a booked day is refused", async () => {
    allure.story("Allocations");
    const day = dateInWeek(-3, "Wed");
    await al.goto("team", { search: EMP3 });
    await al.addAllocatioButtton.first().click();
    await al.fillAllocation({
      employee: EMP3,
      project: ALPHA,
      from: day,
      to: day,
      hours: "1",
    });
    await al.allocate();
    await expect(
      al.page.getByText(
        /Overlapping allocations for the same project are not allowed/,
      ),
    ).toBeVisible();
    expect(
      await getDocList("Resource Allocation", [
        ["employee", "=", process.env.EMP3_ID],
        ["project", "=", alpha],
        ["allocation_start_date", "=", day],
      ]),
    ).toHaveLength(1);
  });

  test("TC279: Allocating more hours than the employee has free warns of over-allocation and still saves", async () => {
    allure.story("Allocations");
    const day = dateInWeek(-3, "Tue");
    await clearAlpha(process.env.EMP3_ID, day, day);
    try {
      await al.goto("team", { search: EMP3 });
      await al.addAllocatioButtton.first().click();
      await al.fillAllocation({
        employee: EMP3,
        project: ALPHA,
        from: day,
        to: day,
        hours: "2",
      });
      // The day already holds 8h on Beta.
      await expect(
        al.dialog.getByText(
          "This allocation causes over-allocation on 1 day (+2h total)",
        ),
      ).toBeVisible();
      await al.allocate();
      await expect(toast("Allocation created successfully")).toBeVisible();
      await expect(al.dialog).toBeHidden();

      await al.page.reload();
      await al.expandRow(EMP3);
      await expect(al.allocationBar(ALPHA).first()).toBeVisible();
      await expect
        .poll(
          async () =>
            (
              await getDocList("Resource Allocation", [
                ["employee", "=", process.env.EMP3_ID],
                ["project", "=", alpha],
                ["allocation_start_date", "=", day],
              ])
            ).length,
        )
        .toBe(1);
    } finally {
      await clearAlpha(process.env.EMP3_ID, day, day);
    }
  });

  test("TC283: Edit Schedule changes this allocation only, or this and the future ones", async () => {
    allure.story("Allocations");
    test.setTimeout(180000);
    await reseedAllocations(data, "EMP2");
    await al.goto("team", { search: EMP2 });

    /** Opens Edit Schedule on the first allocation of the weekly series. */
    const editSchedule = async (hours, mode) => {
      await al.expandRow(EMP2);
      await al.seriesBar(ALPHA).first().click();
      await al.floating
        .getByRole("button", { name: "Edit allocation" })
        .click();
      await al.dialog.getByRole("button", { name: "Edit Schedule" }).click();
      await al.selectScheduleDays();
      await al.scheduleDialog.locator("#edit-hours-per-day").fill(hours);
      await al.scheduleDialog.locator("#edit-hours-per-day").blur();
      if (mode) {
        await al.scheduleDialog.locator("#apply-edits-to").click();
        await al.page.getByRole("option", { name: mode }).click();
      }
      await al.scheduleDialog
        .getByRole("button", { name: "Save changes" })
        .click();
      await expect(toast("Schedule updated.")).toBeVisible();
      await al.page.reload();
      await al.table.waitFor();
      await al.expandRow(EMP2);
      return al.seriesBar(ALPHA).allInnerTexts();
    };

    const one = await editSchedule("03:00");
    expect(one[0]).toMatch(/^3h\/day/);
    expect(one[1]).toMatch(/^2h\/day/);

    const all = await editSchedule("04:00", "This and future");
    expect(all[0]).toMatch(/^4h\/day/);
    expect(all[1]).toMatch(/^4h\/day/);

    await reseedAllocations(data, "EMP2");
  });

  test("TC297: The avatar tooltip shows who last modified the allocation", async () => {
    allure.story("Allocations");
    test.setTimeout(180000);
    const day = dateInWeek(-4, "Thu");
    const today = AllocationsPage.shortDay(new Date());
    await clearAlpha(process.env.EMP3_ID, day, day);
    try {
      // Seeded by Administrator.
      await al.goto("team", { search: member.AlDev });
      expect(await al.modifierOf(await al.openChip(member.AlDev))).toBe(
        "Administrator",
      );

      await al.goto("team", { search: EMP3 });
      await al.addAllocatioButtton.first().click();
      await al.fillAllocation({
        employee: EMP3,
        project: ALPHA,
        from: day,
        to: day,
        hours: "1",
      });
      await al.allocate();
      await expect(toast("Allocation created successfully")).toBeVisible();

      /** The new allocation's popover, read after a reload; EMP3's seeded Alpha day is 2h. */
      const popover = async (hours) => {
        await al.page.reload();
        await al.table.waitFor();
        await al.expandRow(EMP3);
        await al.allocationBarWith(ALPHA, `${hours}h/day for 1 day`).click();
        return al.popover;
      };

      const created = await popover(1);
      await expect(created).toContainText(`Created on ${today}`);
      expect(await al.modifierOf(created)).toBe(process.env.REP_MAN_NAME);

      await created.getByRole("button", { name: "Edit allocation" }).click();
      await al.setHoursPerDay("3");
      await al.dialog
        .getByRole("button", { name: "Save Changes", exact: true })
        .click();
      await expect(toast("Allocation updated successfully")).toBeVisible();

      const edited = await popover(3);
      await expect(edited).toContainText(`Last edited on ${today}`);
      expect(await al.modifierOf(edited)).toBe(process.env.REP_MAN_NAME);
    } finally {
      await clearAlpha(process.env.EMP3_ID, day, day);
    }
  });

  test("TC284: Cancel on the Delete Allocation confirmation keeps the allocation", async () => {
    allure.story("Allocations");
    await al.goto("team", { search: member.AlDelete });
    await (
      await al.openChip(member.AlDelete)
    )
      .getByRole("button", { name: "Delete allocation" })
      .click();
    await expect(al.deleteDialog).toContainText(ALPHA);
    await expect(al.deleteDialog).toContainText(
      AllocationsPage.day(dateInWeek(-2, "Wed")),
    );
    await al.deleteDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(al.deleteDialog).toBeHidden();

    expect(await al.chipTextAfterReload(member.AlDelete)).toContain(
      "8h/day (8 hours)",
    );
  });

  test("TC285: Deleting an allocation removes it and gives the member's hours back", async () => {
    allure.story("Allocations");
    const owned = await getDocList("Resource Allocation", [
      ["employee", "=", data.employees.AlDelete.id],
    ]);
    if (!owned.length) await reseedAllocations(data, "AlDelete");

    await al.goto("team", { search: member.AlDelete });
    await expect(al.chips(member.AlDelete)).toHaveText(["Full"]);
    await (
      await al.openChip(member.AlDelete)
    )
      .getByRole("button", { name: "Delete allocation" })
      .click();
    await al.deleteDialog
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(
      toast("The allocation has been deleted successfully"),
    ).toBeVisible();

    await al.page.reload();
    await al.table.waitFor();
    await expect(al.chips(member.AlDelete)).toHaveCount(0);
    await expect(al.row(member.AlDelete)).not.toContainText("Full");
    await reseedAllocations(data, "AlDelete");
  });

  test("TC286: Leaving Allocations with an unsaved change asks to save or discard it", async ({
    page,
  }) => {
    allure.story("Allocations");
    await al.goto("team", { search: member.AlDrag, duration: "this-month" });
    await al.expandRow(member.AlDrag);
    const bar = al.allocationBar("E2E Alloc Beta");
    await expect(bar).toContainText("2h/day for 1 day");
    await al.stretchBar(bar, 120);
    await expect(bar).not.toContainText("for 1 day");

    await page
      .getByRole("link", { name: /Project|Timesheet|Home/ })
      .first()
      .click();
    await expect(al.unsavedDialog).toContainText(
      "You have unsaved changes. Would you like to save them before leaving?",
    );
    await al.unsavedDialog
      .getByRole("button", { name: "Discard Changes" })
      .click();
    await expect(page).not.toHaveURL(/allocations\/team/);

    await al.goto("team", { search: member.AlDrag, duration: "this-month" });
    await al.expandRow(member.AlDrag);
    await expect(al.allocationBar("E2E Alloc Beta")).toContainText(
      "2h/day for 1 day",
    );
  });
});
