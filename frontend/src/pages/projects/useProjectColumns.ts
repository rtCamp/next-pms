import { computed } from "vue";
import { useRoute } from "vue-router";
import type { SelectorColumn } from "@/components/ColumnSelector";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { parseColumnKeys, queryString } from "@/utils/query";
import {
  COLUMN_ORDER_PARAM,
  MAX_PINNED_COLUMNS,
  PINNED_COLUMNS_PARAM,
  PROJECT_LIST_COLUMNS,
} from "./constants";
import type { ProjectListColumn } from "./types";

export const DEFAULT_COLUMN_ORDER: string[] = PROJECT_LIST_COLUMNS.filter(
  (column) => !column.defaultHidden,
).map((column) => column.key);
const COLUMN_BY_KEY = new Map(
  PROJECT_LIST_COLUMNS.map((column) => [column.key, column]),
);
const KNOWN_KEYS: ReadonlySet<string> = new Set(COLUMN_BY_KEY.keys());

/** Every column, in the shape the column selector offers. */
export const AVAILABLE_PROJECT_COLUMNS: SelectorColumn[] =
  PROJECT_LIST_COLUMNS.map(({ key, label }) => ({ value: key, label }));

/** The known column keys in a saved list or comma-separated param. */
export function parseKeys(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.join(",") : String(value ?? "");
  return parseColumnKeys(raw, KNOWN_KEYS);
}

export function isDefaultOrder(order: string[]) {
  return (
    order.length === DEFAULT_COLUMN_ORDER.length &&
    order.every((key, index) => key === DEFAULT_COLUMN_ORDER[index])
  );
}

export interface ColumnLayout {
  /** Shown columns, pinned ones included, in their unpinned order. */
  order: string[];
  pinned: string[];
}

/** A layout as query params; a default order or no pins leave their param out. */
export function layoutParams(layout: Partial<ColumnLayout>) {
  const params: Record<string, string> = {};
  if (layout.order) {
    params[COLUMN_ORDER_PARAM] = isDefaultOrder(layout.order)
      ? ""
      : layout.order.join(",");
  }
  if (layout.pinned) params[PINNED_COLUMNS_PARAM] = layout.pinned.join(",");
  return params;
}

/**
 * Which columns the project list shows, in what order, and which are pinned to the
 * left, kept in the `columnOrder` and `pinned` query params. Pinned columns come first,
 * in the order they were pinned.
 */
export function useProjectColumns() {
  const route = useRoute();
  const patchQuery = useQueryPatch();

  const order = computed(() => {
    const keys = parseKeys(queryString(route.query[COLUMN_ORDER_PARAM]));
    return keys.length > 0 ? keys : DEFAULT_COLUMN_ORDER;
  });
  const pinned = computed(() =>
    parseKeys(queryString(route.query[PINNED_COLUMNS_PARAM])),
  );

  const columns = computed<ProjectListColumn[]>(() => {
    const pinnedKeys = new Set(pinned.value);
    return [
      ...pinned.value,
      ...order.value.filter((key) => !pinnedKeys.has(key)),
    ].flatMap((key) => COLUMN_BY_KEY.get(key) ?? []);
  });

  /** The shown columns with their pin state, for the column selector's v-model. */
  const selectedColumns = computed<SelectorColumn[]>({
    get: () => {
      const pinnedKeys = new Set(pinned.value);
      return columns.value.map(({ key, label }) => ({
        value: key,
        label,
        pinned: pinnedKeys.has(key),
      }));
    },
    set: (next) =>
      setLayout({
        order: next.map((column) => column.value),
        pinned: next.filter((column) => column.pinned).map((c) => c.value),
      }),
  });

  const isDefault = computed(
    () => pinned.value.length === 0 && isDefaultOrder(order.value),
  );

  function setLayout(layout: Partial<ColumnLayout>) {
    patchQuery(layoutParams(layout));
  }

  function togglePinned(key: string) {
    if (pinned.value.includes(key)) {
      setLayout({ pinned: pinned.value.filter((pin) => pin !== key) });
    } else if (pinned.value.length < MAX_PINNED_COLUMNS) {
      setLayout({ pinned: [...pinned.value, key] });
    }
  }

  /**
   * Applies a header drag: pinned columns reorder among themselves, and the others take
   * the unpinned places in the column order.
   */
  function reorder(next: { pinned: string[]; scrolling: string[] }) {
    if (next.pinned.join(",") !== pinned.value.join(",")) {
      setLayout({ pinned: next.pinned });
    }
    const pinnedKeys = new Set(pinned.value);
    let cursor = 0;
    const nextOrder = order.value.map((key) =>
      pinnedKeys.has(key) ? key : (next.scrolling[cursor++] ?? key),
    );
    if (nextOrder.join(",") !== order.value.join(",")) {
      setLayout({ order: nextOrder });
    }
  }

  function reset() {
    setLayout({ order: DEFAULT_COLUMN_ORDER, pinned: [] });
  }

  return {
    order,
    pinned,
    columns,
    selectedColumns,
    isDefault,
    setLayout,
    togglePinned,
    reorder,
    reset,
  };
}
