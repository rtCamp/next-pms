import { computed } from "vue";
import { useRoute } from "vue-router";
import type { SelectorColumn } from "@/components/ColumnSelector";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { parseColumnKeys, queryString } from "@/utils/query";
import {
  TASK_ACTION_COLUMNS,
  TASK_COLUMN_PARAM,
  TASK_LIST_COLUMNS,
} from "./constants";
import type { TaskListColumn } from "./types";

type DataColumn = (typeof TASK_LIST_COLUMNS)[number];

const DEFAULT_ORDER: string[] = TASK_LIST_COLUMNS.map((column) => column.key);
const COLUMN_BY_KEY = new Map<string, DataColumn>(
  TASK_LIST_COLUMNS.map((column) => [column.key, column]),
);
const KNOWN_KEYS: ReadonlySet<string> = new Set(COLUMN_BY_KEY.keys());

/** Every data column, in the shape the column selector offers. */
export const AVAILABLE_TASK_COLUMNS: SelectorColumn[] = TASK_LIST_COLUMNS.map(
  ({ key, label }) => ({ value: key, label }),
);

function isDefaultOrder(order: string[]) {
  return (
    order.length === DEFAULT_ORDER.length &&
    order.every((key, index) => key === DEFAULT_ORDER[index])
  );
}

/**
 * Which data columns the task list shows, and in what order, kept in the `columnOrder`
 * query param. The action columns always come last.
 */
export function useTaskColumns() {
  const route = useRoute();
  const patchQuery = useQueryPatch();

  const order = computed(() => {
    const keys = parseColumnKeys(
      queryString(route.query[TASK_COLUMN_PARAM]),
      KNOWN_KEYS,
    );
    return keys.length > 0 ? keys : DEFAULT_ORDER;
  });

  const dataColumns = computed(() =>
    order.value.flatMap((key) => COLUMN_BY_KEY.get(key) ?? []),
  );

  const columns = computed<TaskListColumn[]>(() => [
    ...dataColumns.value,
    ...TASK_ACTION_COLUMNS,
  ]);

  /** The shown data columns, for the column selector's v-model. */
  const selectedColumns = computed<SelectorColumn[]>({
    get: () =>
      dataColumns.value.map(({ key, label }) => ({ value: key, label })),
    set: (next) => setColumns(next.map((column) => column.value)),
  });

  const isDefault = computed(() => isDefaultOrder(order.value));

  function setColumns(nextOrder: string[]) {
    patchQuery({
      [TASK_COLUMN_PARAM]: isDefaultOrder(nextOrder) ? "" : nextOrder.join(","),
    });
  }

  function reset() {
    setColumns(DEFAULT_ORDER);
  }

  return { columns, selectedColumns, isDefault, setColumns, reset };
}
