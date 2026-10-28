<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, type CSSProperties } from "vue";
import { Spinner } from "frappe-ui";
import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";
import {
  Feedback,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { isSortable } from "@dnd-kit/dom/sortable";
import { arrayMove } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragDropProviderProps,
  type DragEndEvent,
} from "@dnd-kit/vue";
import { List, ListCell, ListHeader, ListRow, ListRows } from "frappe-ui/list";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";
import ProjectListCell from "./cells/ProjectListCell.vue";
import ColumnHeader from "./ColumnHeader.vue";
import { MAX_PINNED_COLUMNS, MONETARY_SORT_FIELDS } from "./constants";
import { useProjectColumns } from "./useProjectColumns";
import { useProjectFilters } from "./useProjectFilters";
import { useProjectList } from "./useProjectList";

/** Pinned columns stay put only from this scroll-area width up, as in React (`@4xl`). */
const STICKY_MIN_WIDTH = 896;

const projectList = useProjectList();
const { columns, pinned, togglePinned, reorder } = useProjectColumns();

// A press has to move a few pixels before it drags, so the header's sort and menu
// buttons still take plain clicks.
const DRAG_SENSORS: DragDropProviderProps["sensors"] = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: 6 }),
    ],
    // The sort button fills most of the header, and dnd-kit won't start a drag on one.
    preventActivation: () => false,
  }),
];
const DRAG_MODIFIERS: DragDropProviderProps["modifiers"] = [
  RestrictToHorizontalAxis,
];
const DRAG_PLUGINS: DragDropProviderProps["plugins"] = (defaults) => [
  ...defaults,
  Feedback.configure({ dropAnimation: null }),
];

// Read from the sortable's own indexes: a pinned header dropped at the edge of the
// scroll area ends with no drop target, which `move()` needs.
function onDragEnd(event: DragEndEvent) {
  const source = event.operation.source;
  if (event.canceled || !source || !isSortable(source)) return;
  if (source.initialIndex === source.index) return;
  const keys = columns.value.map((column) => column.key);
  const groups = {
    pinned: keys.slice(0, pinnedCount.value),
    scrolling: keys.slice(pinnedCount.value),
  };
  const group = source.group === "pinned" ? "pinned" : "scrolling";
  groups[group] = arrayMove(groups[group], source.initialIndex, source.index);
  reorder(groups);
}
const { filters, sort, setSort } = useProjectFilters();

const scroller = useTemplateRef("scroller");
const scrollerWidth = ref(0);
watch(scroller, (element, _, onCleanup) => {
  if (!element) return;
  const observer = new ResizeObserver(([entry]) => {
    scrollerWidth.value = entry?.contentRect.width ?? 0;
  });
  observer.observe(element);
  onCleanup(() => observer.disconnect());
});

useInfiniteScroll({
  root: scroller,
  sentinel: useTemplateRef("sentinel"),
  count: () => projectList.rows.length,
  canLoad: () => projectList.canLoadMore,
  load: () => projectList.loadMore(),
});

const columnWidths = computed(() =>
  columns.value.map((column) => column.width),
);
const pinnedCount = computed(() => pinned.value.length);
const pinLimit = computed(() => pinnedCount.value >= MAX_PINNED_COLUMNS);

// Cells carry their own padding and the list has no column gap, so pinned cells
// sit edge to edge and each one's offset is the sum of the widths before it.
const stickyStyles = computed<(CSSProperties | undefined)[]>(() => {
  if (scrollerWidth.value < STICKY_MIN_WIDTH) return [];
  let left = 0;
  return columns.value.slice(0, pinnedCount.value).map((column) => {
    const style = { left: `${left}px` };
    left += parseFloat(column.width);
    return style;
  });
});

function pinnedClass(index: number, header = false) {
  if (index >= pinnedCount.value) return undefined;
  return [
    "bg-surface-base",
    stickyStyles.value[index] && ["sticky", header ? "z-20" : "z-[1]"],
    index === pinnedCount.value - 1 && "border-r border-outline-gray-1",
  ];
}

function isSortDisabled(sortField?: string) {
  return (
    !filters.value.currency && MONETARY_SORT_FIELDS.includes(sortField ?? "")
  );
}

function direction(sortField?: string) {
  return sortField && sort.value.field === sortField ? sort.value.order : null;
}

// Same field flips the order; a new field starts descending, as in the React page.
function sortBy(sortField?: string) {
  if (!sortField) return;
  const order =
    sort.value.field === sortField && sort.value.order === "desc"
      ? "asc"
      : "desc";
  setSort({ field: sortField, order });
}
</script>

<template>
  <div
    v-if="projectList.isInitialLoad"
    class="flex h-64 items-center justify-center"
  >
    <Spinner class="size-6" />
  </div>
  <LoadingOverlay v-else :active="projectList.isFilterRequest">
    <div class="flex min-h-0 flex-1 flex-col px-5">
      <p
        v-if="!projectList.isFilterRequest && projectList.rows.length === 0"
        class="py-6 text-center text-base text-ink-gray-5"
      >
        No projects found.
      </p>
      <div v-else ref="scroller" class="min-h-0 flex-1 overflow-auto">
        <DragDropProvider
          :sensors="DRAG_SENSORS"
          :modifiers="DRAG_MODIFIERS"
          :plugins="DRAG_PLUGINS"
          @drag-end="onDragEnd"
        >
          <List
            :columns="columnWidths"
            :row-height="40"
            aria-label="Projects"
            class="w-max min-w-full list-gap-0"
          >
            <ListHeader class="sticky top-0 z-10 bg-surface-base">
              <ColumnHeader
                v-for="(column, index) in columns"
                :key="column.key"
                class="h-full px-1"
                :class="pinnedClass(index, true)"
                :style="stickyStyles[index]"
                :column="column"
                :pinned="index < pinnedCount"
                :pin-limit="index >= pinnedCount && pinLimit"
                :direction="direction(column.sortField)"
                :sort-disabled="isSortDisabled(column.sortField)"
                :group-index="index < pinnedCount ? index : index - pinnedCount"
                @sort="sortBy(column.sortField)"
                @toggle-pin="togglePinned(column.key)"
              />
            </ListHeader>
            <ListRows v-slot="{ item }" :items="projectList.rows">
              <ListRow>
                <ListCell
                  v-for="(column, index) in columns"
                  :key="column.key"
                  class="h-full min-w-0 px-1"
                  :class="pinnedClass(index)"
                  :style="stickyStyles[index]"
                >
                  <ProjectListCell :project="item" :column="column" />
                </ListCell>
              </ListRow>
            </ListRows>
          </List>
        </DragDropProvider>
        <div ref="sentinel" aria-hidden="true" />
        <div
          v-if="projectList.isNextPageLoading"
          class="flex justify-center py-3"
        >
          <Spinner class="size-4" />
        </div>
      </div>
    </div>
  </LoadingOverlay>
</template>
