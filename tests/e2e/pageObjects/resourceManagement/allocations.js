import { gotoWithRetry } from "../../utils/navigation";
import { scaleTimeout } from "../../utils/timeouts";
import { TeamPage } from "./team";

const UNITS = { week: "Week", month: "Month", quarter: "Quarter" };
// A tooltip trigger. The popover has another beside its hours line, the info icon, so
// reach the avatar through the "Created on" / "Last edited on" row it sits in.
const AVATAR = "[data-grace-area-trigger]";

/**
 * The Team and Project tabs of Allocations: the toolbar they share (search, pickers,
 * Duration, Previous/Today/Next, Filter), the grid rows, the chip popovers and the
 * Add/Edit allocation dialog. Extends TeamPage for its filter-panel helper.
 */
export class AllocationsPage extends TeamPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.table = page.getByRole("table");
    // A search or filter that matches nothing replaces the table with this line.
    this.noData = page.getByText("No Data", { exact: true });
    this.headerRow = page.locator("thead");
    // Designation, Department and Allocation type on Team; Allocation type on Project.
    // frappe-ui's MultiSelect drops its aria-label, so its trigger is named by the
    // placeholder or the selection; Duration's Select trigger is a combobox.
    this.pickers = page.locator(
      'button[data-slot="trigger"][aria-haspopup="listbox"]:not([role])',
    );
    this.durationSelect = page
      .getByRole("combobox")
      .filter({ hasText: /^This (week|month|quarter)$/ });
    this.todayButton = page.getByRole("button", { name: "Today", exact: true });
    this.filterButton = page.getByRole("button", { name: /^Filter/ }).first();
    // Base UI floats popovers and hover cards in portals marked with data-side.
    this.floating = page.locator("[data-side]:visible").last();
    // An allocation popover, told apart from a tooltip by its hours line.
    this.popover = page
      .locator("[data-side]:visible")
      .filter({ hasText: /h\/day \(/ })
      .last();
    this.dialog = page.getByRole("dialog", { name: /allocation$/i });
    this.scheduleDialog = page.getByRole("dialog", { name: "Edit schedule" });
    this.deleteDialog = page.getByRole("dialog", { name: "Delete Allocation" });
    this.unsavedDialog = page.getByRole("dialog", { name: "Save Changes" });
  }

  // --------------------------------------
  // Navigation and toolbar
  // --------------------------------------

  /** Opens a tab ("team" or "project") with the URL state given (search, duration, ...). */
  async goto(view = "team", params = {}) {
    const query = new URLSearchParams(params).toString();
    await gotoWithRetry(
      this.page,
      `/next-pms/allocations/${view}${query ? `?${query}` : ""}`,
    );
    await this.table.or(this.noData).waitFor({ timeout: scaleTimeout(40000) });
  }

  /**
   * Opens a tab and waits for a row. A filtered answer can still miss what was seeded a
   * moment ago, and "No Data" counts as loaded, so reload a few times.
   */
  async gotoRow(view, params, name, attempts = 3) {
    for (let attempt = 1; ; attempt++) {
      await this.goto(view, params);
      try {
        await this.row(name).waitFor({ timeout: scaleTimeout(8000) });
        return;
      } catch (err) {
        if (attempt >= attempts) throw err;
      }
    }
  }

  /** Previous/Next are named after the duration: "Previous Week", "Next Quarter". */
  navButton(direction, unit) {
    return this.page.getByRole("button", {
      name: `${direction === "next" ? "Next" : "Previous"} ${UNITS[unit]}`,
    });
  }

  async chooseDuration(label) {
    await this.durationSelect.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  /** Ticks options of a multi-select picker, searching for each one. */
  async pick(picker, values) {
    await picker.click();
    await this.page.getByRole("option").first().waitFor();
    const search = this.page.locator('[data-slot="search"] input');
    for (const value of values) {
      // Designation and Department have a search box; Allocation type lists six options.
      if (await search.isVisible()) await search.fill(value);
      // A department's name carries the company's abbreviation: "E2E Quality - RTIN".
      await this.page.getByRole("option", { name: value }).first().click();
    }
    await this.page.keyboard.press("Escape");
  }

  /** The options of a picker as "label" or "label (disabled)", leaving it open. */
  async pickerOptions(picker) {
    if ((await picker.getAttribute("aria-expanded")) !== "true") {
      await picker.click();
    }
    return this.page
      .getByRole("option")
      .evaluateAll((els) =>
        els.map(
          (el) =>
            el.innerText.trim() +
            (el.getAttribute("aria-disabled") === "true" ||
            el.hasAttribute("data-disabled")
              ? " (disabled)"
              : ""),
        ),
      );
  }

  /** The column headers' text: the week or day labels the grid shows. */
  async headerText() {
    return (await this.headerRow.innerText()).replace(/\s+/g, " ").trim();
  }

  // --------------------------------------
  // Rows
  // --------------------------------------

  /** The names in the grid's top-level rows, from their "Toggle <name>" buttons. */
  async rowNames() {
    return this.table
      .getByRole("button", { name: /^Toggle / })
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("aria-label").replace(/^Toggle /, "")),
      );
  }

  /** A row by the name in its header cell; child rows have no button to anchor on. */
  row(name) {
    return this.table.locator("tbody tr").filter({
      has: this.page.locator("th").getByText(name, { exact: true }),
    });
  }

  /** A member's or project's per-week summary chips ("4h free", "Full"). */
  chips(name) {
    return this.row(name).locator('[data-gantt-bar][role="button"]');
  }

  async hoverCard(name) {
    // The card opens on focus as well as hover, and a headless hover doesn't
    // reliably open it. A row that can't expand has no button, only the hover area.
    const toggle = this.row(name).getByRole("button", {
      name: `Toggle ${name}`,
    });
    if (await toggle.count()) await toggle.focus();
    else await this.row(name).locator("th").first().hover();
    await this.floating.waitFor({ timeout: scaleTimeout(10000) });
    return this.floating;
  }

  /** Opens the popover of a row's chip: project, dates, hours, status, Edit and Delete. */
  async openChip(name, index = 0) {
    // A chip's card opens on hover or focus, not on click.
    await this.chips(name).nth(index).focus();
    // An employee's popover has no buttons, so wait for its hours line.
    await this.popover.waitFor({ timeout: scaleTimeout(10000) });
    return this.popover;
  }

  async expandRow(name) {
    const toggle = this.row(name).getByRole("button", {
      name: `Toggle ${name}`,
    });
    // The row stays open across a reload.
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    // The child rows mount after the toggle; callers read them without waiting.
    await this.row(name)
      .first()
      .locator("xpath=following-sibling::tr[1]")
      .waitFor({ timeout: scaleTimeout(10000) });
  }

  /** The bar of an allocation in an expanded member's project row: "2h/day for 1 day". */
  allocationBar(project) {
    return this.table
      .locator("tbody tr")
      .filter({ hasText: project })
      .getByRole("button")
      .filter({ hasText: /h\/day for \d+ days?/ })
      .first();
  }

  /** An allocation bar in a project row by its exact label: "2h/day for 1 day". */
  allocationBarWith(project, label) {
    return this.table
      .locator("tbody tr")
      .filter({ hasText: project })
      .getByRole("button", { name: label, exact: true })
      .first();
  }

  /** The name in the tooltip of a popover's avatar: who last modified the allocation. */
  async modifierOf(popover) {
    await popover
      .locator("div")
      .filter({ hasText: /(Created|Last edited) on/ })
      .last()
      .locator(AVATAR)
      .first()
      .hover();
    // Reka renders the tooltip's text twice: the visible bubble and a hidden
    // role="tooltip" copy for screen readers. Read the copy.
    const tooltip = this.page.getByRole("tooltip").last();
    await tooltip.waitFor({ state: "attached", timeout: scaleTimeout(10000) });
    return (await tooltip.textContent()).trim();
  }

  /** A project row's bars that span several days, left to right: a weekly series. */
  seriesBar(project) {
    return this.table
      .locator("tbody tr")
      .filter({ hasText: project })
      .getByRole("button")
      .filter({ hasText: /h\/day for ([2-9]|\d{2,}) days/ });
  }

  /** The hatch pattern a tentative allocation's bar is drawn with. */
  hatch(bar) {
    return bar.locator('pattern[id^="gantt-hatch"]');
  }

  /** Stretches an allocation bar by dragging its right edge `pixels` to the right. */
  async stretchBar(bar, pixels) {
    const handle = bar.locator("span.cursor-ew-resize").last();
    const box = await handle.boundingBox();
    const y = box.y + box.height / 2;
    await this.page.mouse.move(box.x + box.width / 2, y);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + box.width / 2 + pixels, y, {
      steps: 10,
    });
    await this.page.mouse.up();
  }

  // --------------------------------------
  // Allocation dialog
  // --------------------------------------

  /** Picks a start and end day in the dialog's calendar, walking months as needed. */
  async pickDateRange(from, to) {
    await this.dateRangeInput.click();
    await this.pickCalendarDay(from);
    await this.pickCalendarDay(to);
    await this.calendarGrid
      .first()
      .waitFor({ state: "hidden", timeout: scaleTimeout(5000) });
  }

  /** Fills Add allocation: employee, project, dates, hours, and optionally a weekly repeat. */
  async fillAllocation({ employee, project, from, to, hours, repeatWeeks }) {
    await this.pickFromCombobox(this.projectDropdown, project);
    await this.pickFromCombobox(this.selectEmployeeDropdown, employee);
    if (repeatWeeks) {
      await this.dialog.getByText("Recurring", { exact: true }).click();
    }
    await this.pickDateRange(from, to);
    await this.setHoursPerDay(hours);
    if (repeatWeeks) {
      await this.dialog
        .getByRole("spinbutton")
        .or(this.dialog.locator("input[type=number]"))
        .first()
        .fill(String(repeatWeeks));
    }
  }

  /** Ticks every day chip in Edit schedule's "Select dates to edit" strip. */
  async selectScheduleDays() {
    const days = this.scheduleDialog.getByRole("button", {
      name: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+/,
    });
    await days.first().waitFor({ timeout: scaleTimeout(10000) });
    for (const day of await days.all()) {
      if (await day.isEnabled()) await day.click();
    }
  }

  allocate() {
    return this.dialog
      .getByRole("button", { name: "Allocate", exact: true })
      .click();
  }

  /** A field's validation message under the dialog, by its exact text. */
  message(text) {
    return this.dialog.getByText(text, { exact: true });
  }

  /** The popover text of a row's chip after the page is fetched afresh. */
  async chipTextAfterReload(name, index = 0) {
    await this.page.reload();
    await this.table.waitFor({ timeout: scaleTimeout(40000) });
    const text = await (await this.openChip(name, index)).innerText();
    await this.page.keyboard.press("Escape");
    return text.replace(/\s+/g, " ");
  }

  /** "Oct 23" for a date, as the popover's Created on / Last edited on line prints it. */
  static shortDay(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  /** "Nov 2 2026" for an ISO date, as the dialog's date range prints it. */
  static rangeDay(iso) {
    return AllocationsPage.day(iso).replace(",", "");
  }

  /** "Nov 2, 2026" for an ISO date, as popovers and dialogs print it. */
  static day(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}
