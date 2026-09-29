/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

/**
 * Internal dependencies.
 */
import { parseColumnKeys } from "@/lib/utils";
import {
  TASK_ACTION_COLUMNS,
  TASK_COLUMN_PARAM,
  TASK_LIST_COLUMNS,
} from "./columns";

const DEFAULT_ORDER = TASK_LIST_COLUMNS.map((column) => column.key);
const COLUMN_BY_KEY = new Map(
  TASK_LIST_COLUMNS.map((column) => [column.key, column]),
);
const KNOWN_KEYS = new Set(COLUMN_BY_KEY.keys());

function isDefaultOrder(order: string[]) {
  return (
    order.length === DEFAULT_ORDER.length &&
    order.every((key, index) => key === DEFAULT_ORDER[index])
  );
}

export function useTaskColumns() {
  const [searchParams, setSearchParams] = useSearchParams();

  const order = useMemo(() => {
    const keys = parseColumnKeys(
      searchParams.get(TASK_COLUMN_PARAM),
      KNOWN_KEYS,
    );
    return keys.length > 0 ? keys : DEFAULT_ORDER;
  }, [searchParams]);

  const selectableColumns = useMemo(
    () => order.flatMap((key) => COLUMN_BY_KEY.get(key) ?? []),
    [order],
  );

  const columns = useMemo(
    () => [...selectableColumns, ...TASK_ACTION_COLUMNS],
    [selectableColumns],
  );

  const setColumns = useCallback(
    (nextOrder: string[]) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (isDefaultOrder(nextOrder)) {
            next.delete(TASK_COLUMN_PARAM);
          } else {
            next.set(TASK_COLUMN_PARAM, nextOrder.join(","));
          }
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const reset = useCallback(() => setColumns(DEFAULT_ORDER), [setColumns]);

  return {
    columns,
    selectableColumns,
    isDefault: isDefaultOrder(order),
    setColumns,
    reset,
  };
}
