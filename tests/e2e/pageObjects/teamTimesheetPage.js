import { gotoWithRetry } from "../utils/navigation";
import { escapeRegExp } from "../utils/stringUtils";
import { scaleTimeout } from "../utils/timeouts";
import { TimesheetTabPage } from "./timesheetTabPage";

// A member row starts with the avatar (an initial, or "Avatar" for a photo), then the name.
const memberName = (name) => new RegExp(`^\\S+ ${escapeRegExp(name)} `);
const DECIDED =
  /^(Approval pending|Approved|Rejected|Partially approved|Partially rejected)$/;
const STATUS =
  /^(Not submitted|Approval pending|Approved|Rejected|Partially approved|Partially rejected|Processing)/i;

/** How the approval drawer names a day: "Mon, Oct 12". */
export const drawerDay = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday}, ${month} ${date.getDate()}`;
};

/**
 * The Team tab of the Timesheet: each week lists members, each member opens onto
 * the projects and tasks they logged, and a submitted week opens the approval drawer.
 */
export class TeamTimesheetPage extends TimesheetTabPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    const banner = page.getByRole("banner");
    this.addTimeButton = banner.getByRole("button", {
      name: "Add time",
      exact: true,
    });
    this.addTimeOffButton = banner.getByRole("button", {
      name: "Add time-off",
      exact: true,
    });
    this.searchInput = page.getByPlaceholder("Search members");
    this.reportsTo = page.getByRole("combobox", { name: "Reports to" });
    this.noData = page.getByText("No data", { exact: true });

    this.drawer = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Approve", exact: true }),
    });
    this.approveButton = this.drawer.getByRole("button", {
      name: "Approve",
      exact: true,
    });
    this.rejectButton = this.drawer.getByRole("button", {
      name: "Reject",
      exact: true,
    });
    this.rejectDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", {
        name: "Reason for timesheet rejection",
      }),
    });
    this.rejectReason = this.rejectDialog.getByRole("textbox", {
      name: "Reason (required)",
    });
    this.rejectSubmit = this.rejectDialog.getByRole("button", {
      name: "Reject timesheet",
    });
  }

  // --------------------------------------
  // Navigation
  // --------------------------------------

  /** Opens the tab; `params` is the state kept in its URL (search, approval, reportsTo, compositeFilters). */
  async goto(params = {}) {
    const query = new URLSearchParams(params).toString();
    await gotoWithRetry(
      this.page,
      `/next-pms/timesheet/team${query ? `?${query}` : ""}`,
    );
    await this.weekHeaders
      .first()
      .or(this.noData)
      .waitFor({ timeout: scaleTimeout(40000) });
  }

  /** Loads the tab again; a decision made elsewhere shows once the page is fetched afresh. */
  async reload() {
    await this.page.reload();
    await this.weekHeaders.first().waitFor({ timeout: scaleTimeout(40000) });
  }

  /** The Timesheets breadcrumb switches tab through a menu named after the current one. */
  async switchTab(from, to) {
    await this.page
      .getByRole("banner")
      .getByRole("button", { name: from, exact: true })
      .click();
    await this.page.getByRole("menuitem", { name: to, exact: true }).click();
  }

  get breadcrumbOptions() {
    return this.page.getByRole("menuitem");
  }

  async chooseReportsTo(name) {
    await this.reportsTo.click();
    await this.reportsTo.fill(name);
    await this.page.getByRole("option", { name }).first().click();
  }

  /** Scrolls the grid down, which loads older weeks and more members of a week. */
  async scrollGrid() {
    await this.page.mouse.move(700, 400);
    await this.page.mouse.wheel(0, 20000);
  }

  /** Brings a week's last loaded member into view, so the next page of members loads under it. */
  async scrollToLastMember(label, prefix) {
    await this.memberRows(label, prefix).last().scrollIntoViewIfNeeded();
    await this.page.mouse.move(700, 400);
    await this.page.mouse.wheel(0, 400);
  }

  async expandWeek(label) {
    const header = this.weekHeader(label);
    await header.waitFor({ timeout: scaleTimeout(30000) });
    if ((await header.getAttribute("aria-expanded")) === "false") {
      await header.click();
    }
  }

  // --------------------------------------
  // Members, projects and tasks
  // --------------------------------------

  /** The rows of a week's members whose names start with `prefix`. */
  memberRows(label, prefix) {
    return this.weekRegion(label).getByRole("button", {
      name: new RegExp(`^\\S+ ${escapeRegExp(prefix)}`),
    });
  }

  /** A member's row in a week: avatar, name, status, the seven days, Total, then the review button. */
  memberRow(label, name) {
    return this.weekRegion(label).getByRole("button", {
      name: memberName(name),
    });
  }

  /** What a member row opens onto: the member's projects, tasks and time-off. */
  memberPanel(label, name) {
    return this.weekRegion(label).getByRole("region", {
      name: memberName(name),
    });
  }

  /** The member's status as the row prints it, e.g. "Approval pending". */
  async memberStatus(label, name) {
    const lines = (await this.memberRow(label, name).innerText())
      .split("\n")
      .map((line) => line.trim());
    return lines.find((line) => STATUS.test(line)) ?? null;
  }

  /** The check button that opens the approval drawer; a week still to submit has none. */
  reviewButton(row) {
    return row.getByRole("button", { name: DECIDED });
  }

  async expandMember(label, name) {
    const row = this.memberRow(label, name);
    if ((await row.getAttribute("aria-expanded")) !== "true") {
      // The day cells in the middle of the row are buttons of their own.
      await row.getByText(name, { exact: true }).click();
    }
    await this.memberPanel(label, name).waitFor({
      timeout: scaleTimeout(15000),
    });
  }

  /** A project's row under a member; its name is followed by the day cells. */
  projectRow(label, member, project) {
    return this.memberPanel(label, member).getByRole("button", {
      name: new RegExp(`^${escapeRegExp(project)} Add time`),
    });
  }

  /** A task or the Time-off row under a member, by the exact label it starts with. */
  detailRow(label, member, text) {
    return this.memberPanel(label, member)
      .locator("div.border-b.transition-colors")
      .filter({ has: this.page.getByText(text, { exact: true }) });
  }

  /** The seven days a row prints, Monday first; the label comes before them and the total after. */
  async rowDays(row) {
    const lines = (await row.innerText())
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.slice(-8, -1);
  }

  // --------------------------------------
  // Adding time on a member's behalf
  // --------------------------------------

  /** Books time from the Add time button: member, project, task, date, duration and comment. */
  async fillAddTime({ employee, project, task, date, duration, comment }) {
    await this.choose("Select employee", employee);
    await this.choose("Select project", project);
    await this.choose("Select task", task);
    await this.pickDate(this.dateField, date);
    await this.addTimeDialog.getByPlaceholder("00:00").fill(duration);
    await this.addTimeDialog.locator("[contenteditable]").first().fill(comment);
  }

  // --------------------------------------
  // Approval drawer
  // --------------------------------------

  async openDrawer(label, member) {
    await this.reviewButton(this.memberRow(label, member)).click();
    await this.drawer.waitFor({ timeout: scaleTimeout(15000) });
  }

  /** A day's header in the drawer: "Mon, Oct 12 01:00", with "· First half off" (or "· Half day off") on a leave day. */
  dayHeader(isoDate) {
    return this.drawer.getByRole("button", {
      name: new RegExp(`^${escapeRegExp(drawerDay(isoDate))} `),
    });
  }

  /** The day's entries: task, project, comment and hours. */
  dayPanel(isoDate) {
    return this.drawer.getByRole("region", {
      name: new RegExp(`^${escapeRegExp(drawerDay(isoDate))} `),
    });
  }

  dayCheckbox(isoDate) {
    return this.dayHeader(isoDate).getByRole("checkbox");
  }

  /** Opens the editor of a day's first entry; its pencil only shows on hover. */
  async editFirstEntry(isoDate) {
    const panel = this.dayPanel(isoDate);
    const entry = panel
      .locator("div")
      .filter({
        has: this.page.getByRole("button", { name: "Edit time entry" }),
      })
      .last();
    await entry.hover();
    await entry.getByRole("button", { name: "Edit time entry" }).click();
    return panel;
  }

  /** Save is the first of the editor's two icon buttons, Cancel the second. */
  entrySave(panel) {
    return panel.getByRole("button").first();
  }

  async approve(label, member) {
    await this.openDrawer(label, member);
    await this.approveButton.click();
  }

  async reject(label, member, reason) {
    await this.openDrawer(label, member);
    await this.rejectButton.click();
    await this.rejectReason.fill(reason);
    await this.rejectSubmit.click();
  }
}
