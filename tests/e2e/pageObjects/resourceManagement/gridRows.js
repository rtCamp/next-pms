/**
 * A top-level row's header cell. Every one draws a chevron, but its "Toggle <name>"
 * button only renders when the row can expand, so a member or project with no
 * allocations has none and goes uncounted when the button is the anchor.
 */
export const TOP_LEVEL_HEADERS = "tbody th:has(.lucide-chevron-right)";

/** The names in the row headers `headers` finds: the toggle's label, else the name's own text. */
export const headerNames = (headers) =>
  headers.evaluateAll((cells) =>
    cells.map((cell) =>
      (
        cell
          .querySelector('button[aria-label^="Toggle "]')
          ?.getAttribute("aria-label")
          .replace(/^Toggle /, "") ??
        cell.querySelector("span.truncate")?.textContent ??
        ""
      ).trim(),
    ),
  );
