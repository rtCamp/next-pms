import { gotoWithRetry } from "../utils/navigation";
import { escapeRegExp } from "../utils/stringUtils";
import { scaleTimeout } from "../utils/timeouts";
import { TimesheetTabPage } from "./timesheetTabPage";

/**
 * The Project tab of the Timesheet: each week lists projects, each project the
 * members who logged time on it, and each member their tasks.
 */
export class ProjectTimesheetPage extends TimesheetTabPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.searchInput = page.getByPlaceholder("Search project");
    this.approvalDrawer = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Approve" }),
    });
  }

  /** Opens the tab; `params` is the state kept in its URL (search, compositeFilters). */
  async goto(params = {}) {
    const query = new URLSearchParams(params).toString();
    await gotoWithRetry(
      this.page,
      `/next-pms/timesheet/project${query ? `?${query}` : ""}`,
    );
    await this.weekHeaders.first().waitFor({ timeout: scaleTimeout(40000) });
  }

  // --------------------------------------
  // Projects, members and tasks
  // --------------------------------------

  /** The row of a project in a week; its name is followed by the day cells. */
  projectRow(label, project) {
    return this.weekRegion(label).getByRole("button", {
      name: new RegExp(`^${escapeRegExp(project)} Add time`),
    });
  }

  /** What a project row opens onto: its members. */
  projectPanel(label, project) {
    return this.weekRegion(label).getByRole("region", {
      name: new RegExp(`^${escapeRegExp(project)} Add time`),
    });
  }

  /** The row of a member under a project: an avatar initial, the name, the status, then the day cells. */
  memberRow(label, project, member) {
    return this.projectPanel(label, project).getByRole("button", {
      name: new RegExp(`^\\S+ ${escapeRegExp(member)} `),
    });
  }

  /** What a member row opens onto: the member's tasks. */
  memberPanel(label, project, member) {
    return this.projectPanel(label, project).getByRole("region", {
      name: new RegExp(`^\\S+ ${escapeRegExp(member)} `),
    });
  }

  /** The member's status badge in the row, e.g. "Approval pending". */
  approvalBadge(row) {
    return row.getByRole("button", {
      name: /^(Approval pending|Approved|Rejected|Partially approved|Partially rejected)$/,
    });
  }

  /** A row opens and closes from its label; the day cells in the middle of it are buttons of their own. */
  async toggle(row, text) {
    await row.getByText(text, { exact: true }).click();
  }
}
