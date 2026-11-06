// The Team and Project grids are flat lists of rows: a row's children follow it as
// siblings, indented one step further (pl-7.5, then pl-13.5, then pl-19.5), with no
// container or ARIA region around them. Each collapsible row has a "Toggle <label>" button.
const ROW = "div.border-b.transition-colors";
const WEEK_LABEL =
  /^Toggle (This week|Last week|[A-Z][a-z]{2} \d+(, \d{4})? - )/;

const hasClass = (name) =>
  `contains(concat(' ', normalize-space(@class), ' '), ' ${name} ')`;
const toggledBy = (label) => `.//button[@aria-label="Toggle ${label}"]`;

/** A row's chevron button, which also carries `aria-expanded`. */
export const rowToggle = (scope, label) =>
  scope.getByRole("button", { name: `Toggle ${label}`, exact: true });

/** The rows in `scope` that toggle open on `label`; a `RegExp` matches the label's start. */
export const rowsLabelled = (scope, page, label) =>
  scope.locator(ROW).filter({
    has:
      label instanceof RegExp
        ? page.getByRole("button", {
            name: new RegExp(`^Toggle ${label.source}`),
          })
        : rowToggle(page, label),
  });

/** The header rows of the weeks. */
export const weekHeaders = (page) =>
  page
    .locator(ROW)
    .filter({ has: page.getByRole("button", { name: WEEK_LABEL }) });

/** A week's header row, by its label ("This week", "Oct 5 - 11, 2026"). */
export const weekHeader = (page, label) => rowsLabelled(page, page, label);

/** A week: its header row and every row under it. */
export const weekRegion = (page, label) =>
  page.locator("div.scroll-mt-7").filter({ has: rowToggle(page, label) });

/**
 * The rows nested under a chain of open rows, e.g. `[{ level: "pl-7.5", label: project },
 * { level: "pl-13.5", label: member }]`: the rows after the last one up to the next row
 * at its level or above, where every row of the chain is the nearest one at its level.
 */
export const nestedRows = (scope, path) => {
  const levels = path.map(({ level }) => hasClass(level));
  const chain = path
    .map(
      ({ label }, index) =>
        `[preceding-sibling::div[${levels.slice(0, index + 1).join(" or ")}][1][${toggledBy(label)}]]`,
    )
    .join("");
  return scope.locator(
    `xpath=.//div[${hasClass("border-b")}][not(${levels.join(" or ")})]${chain}`,
  );
};

/** The seven day cells of a row, Monday first; empty ones are named "Add time". */
export const dayCells = (row) => row.locator(":scope > div.w-16 > button");

/**
 * What a row prints in its day and Total columns: the seven days, Monday first, then
 * the total. A holiday's day also holds its name for screen readers, so only the
 * first line of each counts.
 */
export const rowColumns = (row) =>
  row
    .locator(":scope > div.w-16")
    .evaluateAll((columns) =>
      columns.map((column) => column.innerText.trim().split("\n")[0].trim()),
    );

/** Picks `isoDate` in the open frappe-ui calendar, paging months as needed. */
export const pickCalendarDay = async (page, isoDate) => {
  const grid = page.getByRole("grid", { name: "Calendar dates" }).last();
  const day = grid.locator(`[role=gridcell][data-value="${isoDate}"]`);
  await grid.waitFor();
  for (let paged = 0; paged < 24 && !(await day.count()); paged++) {
    const first = await grid
      .locator("[role=gridcell]")
      .first()
      .getAttribute("data-value");
    await page
      .getByRole("button", { name: isoDate < first ? "previous" : "next" })
      .last()
      .click();
  }
  await day.click();
};
