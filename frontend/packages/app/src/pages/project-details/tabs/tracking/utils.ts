/**
 * Internal dependencies.
 */
import { CUSTOMIZABLE_WIDGET_KEYS } from "./constants";
import type { TrackingLayout, WidgetKey } from "./types";
import { WIDGETS } from "./widgetRegistry";

/**
 * A set of known widget keys, used to filter out unknown keys from stored layouts.
 */
const KNOWN_KEYS = new Set<string>(Object.keys(WIDGETS));

/**
 * Parses a stored layout from the database into a TrackingLayout, filtering out unknown keys.
 */
export function parseStoredLayout(rows: unknown): TrackingLayout | null {
  if (!Array.isArray(rows)) {
    return null;
  }

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

/**
 * Applies a set of hidden widgets to a layout, returning a new layout with those widgets removed.
 */
export function applyHiddenWidgets(
  defaultLayout: TrackingLayout,
  hidden: WidgetKey[],
): TrackingLayout {
  return defaultLayout
    .map((row) => row.filter((key) => !hidden.includes(key)))
    .filter((row) => row.length > 0);
}

/**
 * Returns the list of hidden widgets based on the default layout and the stored layout.
 */
export function getHiddenWidgets(
  defaultLayout: TrackingLayout,
  storedLayout: TrackingLayout,
): WidgetKey[] {
  const stored = new Set(storedLayout.flat());

  return defaultLayout
    .flat()
    .filter(
      (key) => CUSTOMIZABLE_WIDGET_KEYS.includes(key) && !stored.has(key),
    );
}
