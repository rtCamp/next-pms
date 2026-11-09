const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { reseedLeave } from "../../helpers/weekTimeHelper";
import { DashboardPage } from "../../pageObjects/dashboardPage";
import { getDocument } from "../../utils/api/apiClient";
import { readJSONFile, writeDataToFile } from "../../utils/fileUtils";

// TC359 (data/manager/dashboard.js) seeds four direct reports with leaves ahead: three
// Open (DbOpen, DbApprove, DbReject) and one Approved (DbAway). The cases approve and
// reject them, so they run in order.
test.describe.configure({ mode: "serial" });

const FIXTURE = "TC359";
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const parts = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month: MONTHS[month - 1], day };
};
/** "05 Nov 2026", as a row prints a date. */
const rowDate = (iso) => {
  const { year, month, day } = parts(iso);
  return `${String(day).padStart(2, "0")} ${month} ${year}`;
};
/** "5 Nov 2026" or "2 Nov – 4 Nov 2026", as a dialog prints the range. */
const dialogRange = (from, to) => {
  const a = parts(from);
  const b = parts(to);
  return from === to
    ? `${a.day} ${a.month} ${a.year}`
    : `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
};
const duration = (days) => `${days} ${days === 1 ? "day" : "days"}`;

test.describe("Manager: Dashboard Upcoming time-offs", () => {
  /** @type {DashboardPage} */ let dashboard;
  let data;
  let stubPath;
  const employee = (key) => data.employees[key].name;
  const leave = (name) => getDocument("Leave Application", name);
  /** The case's leave, Open again if an earlier attempt decided it; kept on the stub. */
  const openLeave = async (key) => {
    const name = await reseedLeave(data, key);
    await writeDataToFile(stubPath, { [FIXTURE]: data });
    return name;
  };

  test.beforeEach(async ({ page, jsonDir }) => {
    dashboard = new DashboardPage(page);
    stubPath = path.join(jsonDir, `${FIXTURE}.json`);
    data = (await readJSONFile(stubPath))[FIXTURE];
  });

  /** The leave's summary card shows who, what, when, how long and why. */
  const expectSummary = async (dialog, key, doc) => {
    await expect(dialog).toContainText(employee(key));
    await expect(dialog).toContainText(`${doc.leave_type} · Full day`);
    await expect(dialog).toContainText(dialogRange(doc.from_date, doc.to_date));
    await expect(dialog).toContainText(duration(doc.total_leave_days));
    await expect(dialog).toContainText("Reason");
    await expect(dialog).toContainText(doc.description);
  };

  test("TC371: Upcoming time-offs lists the reports' Open leaves first with a pending count and buttons, then Approved ones", async () => {
    allure.story("Dashboard");
    for (const key of ["open", "approve", "reject"]) {
      await openLeave(key);
    }
    const { get_employees_on_leave: leaves } = await dashboard.goto("manager", [
      "get_employees_on_leave",
    ]);

    for (const key of ["DbOpen", "DbApprove", "DbReject"]) {
      const row = dashboard.timeOffRow(employee(key));
      await expect(row, key).toContainText("Open");
      await expect(row.getByRole("button"), key).toHaveCount(2);
    }
    const away = dashboard.timeOffRow(employee("DbAway"));
    await expect(away).toContainText("Approved");
    await expect(away.getByRole("button")).toHaveCount(0);

    const open = await leave(data.leaves.open);
    await expect(dashboard.timeOffRow(employee("DbOpen"))).toContainText(
      `${rowDate(open.from_date)} → ${rowDate(open.to_date)}`,
    );

    const statuses = await dashboard.timeOffStatuses();
    expect(statuses).toEqual(
      [...statuses].sort((a, b) => a.localeCompare(b) * -1),
    );
    const pending = leaves.filter((l) => l.status === "Open").length;
    expect(statuses.filter((s) => s === "Open")).toHaveLength(pending);
    await expect(dashboard.pendingBadge).toHaveText(`${pending} pending`);
  });

  test("TC372: Approving a leave asks for confirmation first, and Cancel approves nothing", async () => {
    allure.story("Dashboard");
    const name = await openLeave("open");
    await dashboard.goto("manager");
    await dashboard.openApprove(employee("DbOpen"));
    await expect(dashboard.approveDialog).toContainText(
      "Approving submits this leave application. It cannot be undone from Next PMS.",
    );
    await dashboard.approveDialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(dashboard.approveDialog).toBeHidden();

    await expect(dashboard.timeOffRow(employee("DbOpen"))).toContainText(
      "Open",
    );
    expect(await leave(name)).toEqual(
      expect.objectContaining({ status: "Open", docstatus: 0 }),
    );
  });

  test("TC373: Approve leave shows the request in full, approves it, and the row turns Approved without buttons", async () => {
    allure.story("Dashboard");
    const name = await openLeave("approve");
    const doc = await leave(name);
    await dashboard.goto("manager");
    await dashboard.openApprove(employee("DbApprove"));
    await expectSummary(dashboard.approveDialog, "DbApprove", doc);

    await dashboard.approveDialog
      .getByRole("button", { name: "Approve leave", exact: true })
      .click();
    await expect(dashboard.toast("Leave application approved")).toBeVisible();
    await expect(dashboard.approveDialog).toBeHidden();
    const row = dashboard.timeOffRow(employee("DbApprove"));
    await expect(row).toContainText("Approved");
    await expect(row.getByRole("button")).toHaveCount(0);
    expect(await leave(name)).toEqual(
      expect.objectContaining({ status: "Approved", docstatus: 1 }),
    );
  });

  test("TC374: Reject leave needs a reason: the button stays disabled and the form says the reason is required", async () => {
    allure.story("Dashboard");
    const name = await openLeave("open");
    await dashboard.goto("manager");
    await dashboard.openReject(employee("DbOpen"));
    const reject = dashboard.rejectDialog.getByRole("button", {
      name: "Reject leave",
      exact: true,
    });
    await expect(reject).toBeDisabled();

    await dashboard.rejectionReason.fill("x");
    await expect(reject).toBeEnabled();
    await dashboard.rejectionReason.fill("");
    await expect(
      dashboard.rejectDialog.getByText("Rejection reason is required."),
    ).toBeVisible();
    await expect(reject).toBeDisabled();
    await dashboard.rejectionReason.fill("   ");
    await expect(reject).toBeDisabled();

    await dashboard.rejectDialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(dashboard.rejectDialog).toBeHidden();
    expect(await leave(name)).toEqual(
      expect.objectContaining({ status: "Open", docstatus: 0 }),
    );
  });

  test("TC375: Rejecting a leave records the reason, and the leave leaves the list", async () => {
    allure.story("Dashboard");
    const name = await openLeave("reject");
    const doc = await leave(name);
    const reason = `E2E Db rejected ${Date.now()}`;
    await dashboard.goto("manager");
    await dashboard.openReject(employee("DbReject"));
    await expectSummary(dashboard.rejectDialog, "DbReject", doc);

    await dashboard.rejectionReason.fill(reason);
    await dashboard.rejectDialog
      .getByRole("button", { name: "Reject leave", exact: true })
      .click();
    await expect(dashboard.toast("Leave application rejected")).toBeVisible();
    await expect(dashboard.rejectDialog).toBeHidden();
    await expect(dashboard.timeOffRow(employee("DbReject"))).toHaveCount(0);
    // Submitted without a workflow; staging's leave workflow keeps a rejection a draft.
    expect(await leave(name)).toEqual(
      expect.objectContaining({
        status: "Rejected",
        custom_rejection_reason: reason,
      }),
    );
  });
});
