/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { move } from "@dnd-kit/helpers";

/**
 * Internal dependencies.
 */
import { parseColumnKeys } from "@/lib/utils";
import { COLUMN_PARAM_KEYS, PROJECT_LIST_COLUMNS } from "./constants";
import { useProjectViews } from "../../views";

const DEFAULT_ORDER = PROJECT_LIST_COLUMNS.map((column) => column.key);
const COLUMN_BY_KEY = new Map(
  PROJECT_LIST_COLUMNS.map((column) => [column.key, column]),
);
const KNOWN_KEYS = new Set(COLUMN_BY_KEY.keys());

function parseKeys(value: unknown) {
  return parseColumnKeys(value, KNOWN_KEYS);
}

/**
 * Falls back to the default order when no explicit column order is stored.
 */
function resolveOrder(order: string[]) {
  return order.length > 0 ? order : DEFAULT_ORDER;
}

/**
 * Checks if the given column order matches the default order.
 */
function isDefaultOrder(order: string[]) {
  return (
    order.length === DEFAULT_ORDER.length &&
    order.every((key, index) => key === DEFAULT_ORDER[index])
  );
}

export function useColumnLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = useProjectViews((state) => state.state.activeView);

  const savedOrder = useMemo(
    () => resolveOrder(parseKeys(activeView?.columns)),
    [activeView],
  );
  const savedPinned = useMemo(
    () => parseKeys(activeView?.pinnedColumns),
    [activeView],
  );

  // The search params hold the layout in use, the view holds the saved one.
  const baseOrder = useMemo(
    () => resolveOrder(parseKeys(searchParams.get(COLUMN_PARAM_KEYS.columns))),
    [searchParams],
  );

  const pinnedColumns = useMemo(
    () => parseKeys(searchParams.get(COLUMN_PARAM_KEYS.pinnedColumns)),
    [searchParams],
  );

  const columns = useMemo(() => {
    const pinned = new Set(pinnedColumns);
    const order = [
      ...pinnedColumns,
      ...baseOrder.filter((key) => !pinned.has(key)),
    ];
    return order.flatMap((key) => COLUMN_BY_KEY.get(key) ?? []);
  }, [baseOrder, pinnedColumns]);

  /**
   * Writes the updated column layout (order and pinned columns) to the search parameters.
   */
  const writeLayout = useCallback(
    (next: { order?: string[]; pinned?: string[] }) => {
      setSearchParams(
        (params) => {
          // A default layout is left unsaid rather than spelled out.
          if (next.order) {
            if (isDefaultOrder(next.order)) {
              params.delete(COLUMN_PARAM_KEYS.columns);
            } else {
              params.set(COLUMN_PARAM_KEYS.columns, next.order.join(","));
            }
          }
          if (next.pinned) {
            if (next.pinned.length === 0) {
              params.delete(COLUMN_PARAM_KEYS.pinnedColumns);
            } else {
              params.set(
                COLUMN_PARAM_KEYS.pinnedColumns,
                next.pinned.join(","),
              );
            }
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /**
   * Reorders the scrolling columns based on the provided new order while keeping the pinned columns in place.
   */
  const reorderScrolling = useCallback(
    (nextScrolling: string[]) => {
      const pinned = new Set(pinnedColumns);
      let cursor = 0;
      writeLayout({
        order: baseOrder.map((key) =>
          pinned.has(key) ? key : nextScrolling[cursor++],
        ),
      });
    },
    [baseOrder, pinnedColumns, writeLayout],
  );

  const reorderPinned = useCallback(
    (nextPinned: string[]) => writeLayout({ pinned: nextPinned }),
    [writeLayout],
  );

  /**
   * Replaces the visible columns and the pinned subset in one write.
   */
  const setColumns = useCallback(
    (order: string[], pinned: string[]) => writeLayout({ order, pinned }),
    [writeLayout],
  );

  const togglePinned = useCallback(
    (key: string) =>
      writeLayout({
        pinned: pinnedColumns.includes(key)
          ? pinnedColumns.filter((pinnedKey) => pinnedKey !== key)
          : [...pinnedColumns, key],
      }),
    [pinnedColumns, writeLayout],
  );

  const groupedKeys = useMemo(
    () => ({
      pinned: pinnedColumns,
      scrolling: baseOrder.filter((key) => !pinnedColumns.includes(key)),
    }),
    [baseOrder, pinnedColumns],
  );

  /**
   * Handles the end of a drag-and-drop operation, updating the pinned and scrolling column order accordingly.
   */
  const handleDragEnd = useCallback(
    (event: Parameters<typeof move>[1]) => {
      const next = move(groupedKeys, event);
      if (next.pinned.join(",") !== groupedKeys.pinned.join(",")) {
        reorderPinned(next.pinned);
      }
      if (next.scrolling.join(",") !== groupedKeys.scrolling.join(",")) {
        reorderScrolling(next.scrolling);
      }
    },
    [groupedKeys, reorderPinned, reorderScrolling],
  );

  /**
   * Resets the column layout to its default state by removing the relevant search parameters.
   */
  const reset = useCallback(
    () => writeLayout({ order: DEFAULT_ORDER, pinned: [] }),
    [writeLayout],
  );

  /**
   * Reverts the column layout to the last saved state.
   */
  const revert = useCallback(
    () => writeLayout({ order: savedOrder, pinned: savedPinned }),
    [writeLayout, savedOrder, savedPinned],
  );

  // Keeps track of the view that was applied to ensure the layout is only reset when switching views.
  const appliedView = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!activeView) {
      return;
    }
    const previous = appliedView.current;
    appliedView.current = String(activeView.name);
    const opened =
      previous === undefined &&
      (searchParams.has(COLUMN_PARAM_KEYS.columns) ||
        searchParams.has(COLUMN_PARAM_KEYS.pinnedColumns));
    if (opened || previous === appliedView.current) {
      return;
    }
    revert();
  }, [activeView, searchParams, revert]);

  return {
    columns,
    pinnedColumns,
    isDefault: pinnedColumns.length === 0 && isDefaultOrder(baseOrder),
    isDirty:
      baseOrder.join(",") !== savedOrder.join(",") ||
      pinnedColumns.join(",") !== savedPinned.join(","),
    /** The layout as it is saved onto the view. */
    layout: { columns: baseOrder, pinnedColumns: pinnedColumns },
    reorderScrolling,
    reorderPinned,
    setColumns,
    togglePinned,
    handleDragEnd,
    revert,
    reset,
  };
}
