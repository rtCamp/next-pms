import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";
import {
  dayCells,
  nestedRows,
  rowColumns,
  rowsLabelled,
  rowToggle,
  weekHeader,
  weekHeaders,
  weekRegion,
} from "./timesheetGrid";
import { TimesheetTabPage } from "./timesheetTabPage";

const PROJECT_LEVEL = "pl-7.5";
const MEMBER_LEVEL = "pl-13.5";

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
    this.approvalFilter = page.getByRole("button", { name: "Approval status" });
  }

  get weekHeaders() {
    return weekHeaders(this.page);
  }

  weekHeader(label) {
    return weekHeader(this.page, label);
  }

  weekRegion(label) {
    return weekRegion(this.page, label);
  }

  cells(row) {
    return dayCells(row);
  }

  async rowTotal(row) {
    return (await rowColumns(row))[7];
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
    return rowsLabelled(this.weekRegion(label), this.page, project);
  }

  /** The rows a project row opens onto: its members and their tasks. */
  projectPanel(label, project) {
    return nestedRows(this.weekRegion(label), [
      { level: PROJECT_LEVEL, label: project },
    ]);
  }

  /** The row of a member under a project: an avatar initial, the name, the status, then the day cells. */
  memberRow(label, project, member) {
    return this.projectPanel(label, project).filter({
      has: rowToggle(this.page, member),
    });
  }

  /** The rows a member row opens onto: the member's tasks and time-off. */
  memberPanel(label, project, member) {
    return nestedRows(this.weekRegion(label), [
      { level: PROJECT_LEVEL, label: project },
      { level: MEMBER_LEVEL, label: member },
    ]);
  }

  /** The member's status badge in the row, e.g. "Approval pending". */
  approvalBadge(row) {
    return row.getByRole("button", {
      name: /^(Approval pending|Approved|Rejected|Partially approved|Partially rejected)$/,
    });
  }

  /** A row's chevron, which opens and closes it and carries `aria-expanded`. */
  rowToggle(row, text) {
    return rowToggle(row, text);
  }

  async toggle(row, text) {
    await rowToggle(row, text).click();
  }
}
