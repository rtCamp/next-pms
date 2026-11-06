import { CUSTOMIZABLE_WIDGETS, WIDGET_KEYS } from "./constants";
import type { TrackingLayout, WidgetKey } from "./types";

const KNOWN_KEYS = new Set<string>(WIDGET_KEYS);
const CUSTOMIZABLE_KEYS = new Set(CUSTOMIZABLE_WIDGETS.map(({ key }) => key));

/** The layout for a billing type; Non-Billable and unset drop the financials. */
export function defaultLayout(billingType: string): TrackingLayout {
  const billable = Boolean(billingType) && billingType !== "Non-Billable";
  return [
    billable ? ["financials", "task_completion"] : ["task_completion"],
    ["hours_usage", "invoice_burn"],
    ["budget_burn", "cost_burn"],
    ["lifetime_to_date", "lifetime_expected", "lifetime_vs_billed"],
    ["contracts"],
    ["rates"],
  ];
}

/** A saved layout without unknown keys or empty rows; `null` when it isn't a list. */
export function parseStoredLayout(rows: unknown): TrackingLayout | null {
  if (typeof rows === "string") {
    try {
      return parseStoredLayout(JSON.parse(rows));
    } catch {
      return null;
    }
  }
  if (!Array.isArray(rows)) return null;
  return rows
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) =>
      row.filter(
        (key): key is WidgetKey =>
          typeof key === "string" && KNOWN_KEYS.has(key),
      ),
    )
    .filter((row) => row.length > 0);
}

/** `layout` without the `hidden` widgets and the rows they leave empty. */
export function applyHiddenWidgets(
  layout: TrackingLayout,
  hidden: WidgetKey[],
): TrackingLayout {
  return layout
    .map((row) => row.filter((key) => !hidden.includes(key)))
    .filter((row) => row.length > 0);
}

/** The customizable widgets of `layout` that `stored` leaves out. */
export function hiddenWidgets(
  layout: TrackingLayout,
  stored: TrackingLayout,
): WidgetKey[] {
  const kept = new Set(stored.flat());
  return layout
    .flat()
    .filter((key) => CUSTOMIZABLE_KEYS.has(key) && !kept.has(key));
}
