import { gotoWithRetry } from "../utils/navigation";
import { scaleTimeout } from "../utils/timeouts";
import { TimesheetTabPage } from "./timesheetTabPage";

// A week's rows are flat, so how deep one sits is only drawn as its left padding.
const LEVEL = { project: "pl-7.5", member: "pl-13.5", task: "pl-19.5" };
const atLevel = (level) =>
  `contains(concat(' ', normalize-space(@class), ' '), ' ${LEVEL[level]} ')`;

// An XPath string literal, which has no escape for its own quote.
const literal = (text) =>
  text.includes("'")
    ? `concat('${text.split("'").join(`', "'", '`)}')`
    : `'${text}'`;

// Every row opens and closes from a chevron named "Toggle <what the row is>".
const toggles = (name) => `.//button[@aria-label=${literal(`Toggle ${name}`)}]`;

// Of the rows above it, the nearest at the level is the one carrying this name.
const under = (level, name) =>
  `preceding-sibling::div[${atLevel(level)}][1][${toggles(name)}]`;

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
    // The Personal tab's Approval status filter has no counterpart here.
    this.approvalFilter = page.getByRole("button", { name: "Approval status" });
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

  /** The rows of a week at a level that satisfy `conditions` (XPath predicates). */
  rowsAt(label, level, ...conditions) {
    const where = [atLevel(level), ...conditions].map((c) => `[${c}]`).join("");
    return this.weekRegion(label).locator(`xpath=./div[2]/div${where}`);
  }

  /** The row of a project in a week; its name is followed by the day cells. */
  projectRow(label, project) {
    return this.rowsAt(label, "project", toggles(project));
  }

  /** The row of a member under a project: an avatar initial, the name, the status, then the day cells. */
  memberRow(label, project, member) {
    return this.rowsAt(
      label,
      "member",
      toggles(member),
      under("project", project),
    );
  }

  /** The rows of the tasks a member opens onto, drawn after the member's own row. */
  memberTasks(label, project, member) {
    const nearest = `preceding-sibling::div[${atLevel("member")} or ${atLevel("project")}][1]`;
    return this.rowsAt(
      label,
      "task",
      `${nearest}[${atLevel("member")}][${toggles(member)}][${under("project", project)}]`,
    );
  }

  /** The member's status badge in the row, e.g. "Approval pending". */
  approvalBadge(row) {
    return row.getByRole("button", {
      name: /^(Approval pending|Approved|Rejected|Partially approved|Partially rejected)$/,
    });
  }

  /** The chevron of a project or member row; it carries whether the row is open. */
  toggleButton(row) {
    return row.getByRole("button", { name: /^Toggle / });
  }

  async toggle(row) {
    await this.toggleButton(row).click();
  }
}
