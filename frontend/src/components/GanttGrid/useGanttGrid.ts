import {
  computed,
  inject,
  provide,
  reactive,
  readonly,
  ref,
  watch,
  type InjectionKey,
} from "vue";
import { MIN_ROW_HEADER_WIDTH, ROW_HEADER_WIDTH } from "./constants";
import { buildTimeline, columnWidthFor, type TimelineRange } from "./geometry";
import { prepareEmployeeRows, prepareProjectRows } from "./rows";
import type { GanttGridEmits, GanttGridProps } from "./types";

type Emit = <E extends keyof GanttGridEmits>(
  event: E,
  ...args: GanttGridEmits[E]
) => void;

function createGanttGrid(props: Readonly<GanttGridProps>, emit: Emit) {
  const headerWidth = ref(ROW_HEADER_WIDTH);
  const containerWidth = ref(0);
  const expanded = reactive(new Set<string>());

  const variant = computed(() => props.variant);
  const showWeekend = computed(() => props.showWeekend ?? true);
  const weekCount = computed(() => props.weekCount ?? 3);
  const hasRoleAccess = computed(() => props.hasRoleAccess ?? false);
  const canManageAiAllocations = computed(
    () => props.canManageAiAllocations ?? false,
  );

  const timeline = computed(() =>
    buildTimeline({
      startDate: props.startDate,
      weekCount: weekCount.value,
      showWeekend: showWeekend.value,
    }),
  );
  // A number, so dragging the header column only re-places bars when it changes.
  const columnWidth = computed(() =>
    columnWidthFor(
      weekCount.value,
      timeline.value.daysPerWeek,
      headerWidth.value,
      containerWidth.value,
    ),
  );
  const range = computed<TimelineRange>(() => ({
    weekStart: timeline.value.weekStart,
    showWeekend: showWeekend.value,
    columnCount: timeline.value.columnCount,
    columnWidth: columnWidth.value,
    headerWidth: headerWidth.value,
  }));
  const rowWidth = computed(
    () => headerWidth.value + columnWidth.value * timeline.value.columnCount,
  );

  const barRange = computed(() => ({
    weekStart: timeline.value.weekStart,
    showWeekend: showWeekend.value,
    columnCount: timeline.value.columnCount,
    columnWidth: columnWidth.value,
  }));
  const employeeRows = computed(() =>
    variant.value === "team"
      ? prepareEmployeeRows(props.employees ?? [], barRange.value)
      : [],
  );
  const projectRows = computed(() =>
    variant.value === "project"
      ? prepareProjectRows(props.projects ?? [], barRange.value)
      : [],
  );
  const rowKeys = computed(() =>
    variant.value === "team"
      ? employeeRows.value.map((row) => row.key)
      : projectRows.value.map((row) => row.key),
  );

  // Rows that left the data don't come back expanded.
  watch(rowKeys, (keys) => {
    const present = new Set(keys);
    for (const key of expanded) if (!present.has(key)) expanded.delete(key);
  });

  function isExpanded(key: string) {
    return expanded.has(key);
  }

  function toggleRow(key: string) {
    const expanding = !expanded.has(key);
    if (expanding) expanded.add(key);
    else expanded.delete(key);
    emit("toggle", key, expanding);
  }

  /** Whether the row after `index` is expanded while this one isn't, for its bottom border. */
  function isNextExpanded(index: number) {
    const keys = rowKeys.value;
    return !expanded.has(keys[index]) && expanded.has(keys[index + 1] ?? "");
  }

  return {
    variant,
    showWeekend,
    hasRoleAccess,
    canManageAiAllocations,
    timeline,
    columnWidth,
    range,
    rowWidth,
    headerWidth: readonly(headerWidth),
    setHeaderWidth: (width: number) => {
      headerWidth.value = Math.max(MIN_ROW_HEADER_WIDTH, Math.round(width));
    },
    setContainerWidth: (width: number) => {
      containerWidth.value = Math.max(0, Math.round(width));
    },
    employeeRows,
    projectRows,
    isExpanded,
    isNextExpanded,
    toggleRow,
    emit,
  };
}

export type GanttGridContext = ReturnType<typeof createGanttGrid>;

const ganttGridKey: InjectionKey<GanttGridContext> = Symbol("ganttGrid");

/** Creates the grid's shared state from its props and provides it to its rows and bars. */
export function provideGanttGrid(
  props: Readonly<GanttGridProps>,
  emit: Emit,
): GanttGridContext {
  const grid = createGanttGrid(props, emit);
  provide(ganttGridKey, grid);
  return grid;
}

/** The state of the `GanttGrid` this component is in. */
export function useGanttGrid(): GanttGridContext {
  const grid = inject(ganttGridKey);
  if (!grid) throw new Error("useGanttGrid() needs a GanttGrid parent");
  return grid;
}
