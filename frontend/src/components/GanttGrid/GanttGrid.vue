<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
  watch,
} from "vue";
import { Skeleton } from "frappe-ui";
import { InfoHoverCard } from "@/components/InfoHoverCard";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";
import {
  HEADER_HEIGHT,
  LOADING_ROW_COUNT,
  RESIZE_DEBOUNCE_MS,
} from "./constants";
import GanttEmployeeGroup from "./GanttEmployeeGroup.vue";
import GanttProjectGroup from "./GanttProjectGroup.vue";
import GanttWeekHeader from "./GanttWeekHeader.vue";
import type { GanttGridEmits, GanttGridProps } from "./types";
import { provideGanttGrid } from "./useGanttGrid";
import { usePointerDrag } from "./usePointerDrag";

const props = withDefaults(defineProps<GanttGridProps>(), {
  weekCount: 3,
  employees: () => [],
  projects: () => [],
  showWeekend: true,
  hasRoleAccess: false,
  canManageAiAllocations: false,
  loading: false,
  hasMore: false,
  scrollResetKey: "",
});

const emit = defineEmits<GanttGridEmits>();

const grid = provideGanttGrid(props, emit);
const { timeline, columnWidth, headerWidth, rowWidth } = grid;

const scroller = useTemplateRef<HTMLElement>("scroller");
const loadingRows = useTemplateRef<HTMLElement>("loadingRows");

const rowCount = computed(() =>
  props.variant === "team"
    ? grid.employeeRows.value.length
    : grid.projectRows.value.length,
);
const fillHeight = computed(() => !props.hasMore);
const headerCellStyle = computed(() => ({
  width: `${headerWidth.value}px`,
  minWidth: `${headerWidth.value}px`,
  maxWidth: `${headerWidth.value}px`,
}));

useInfiniteScroll({
  root: scroller,
  sentinel: loadingRows,
  count: () => rowCount.value,
  canLoad: () => !props.loading && props.hasMore,
  load: () => emit("loadMore"),
});

watch(
  () => props.scrollResetKey,
  () => scroller.value?.scrollTo({ top: 0, left: 0 }),
);

let resizeObserver: ResizeObserver | undefined;
let resizeTimer: number | undefined;
onMounted(() => {
  const element = scroller.value;
  if (!element) return;
  grid.setContainerWidth(element.clientWidth);
  resizeObserver = new ResizeObserver(([entry]) => {
    if (!entry) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(
      () => grid.setContainerWidth(entry.contentRect.width),
      RESIZE_DEBOUNCE_MS,
    );
  });
  resizeObserver.observe(element);
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.clearTimeout(resizeTimer);
});

const columnResize = usePointerDrag();
function startColumnResize(event: PointerEvent) {
  event.preventDefault();
  const startWidth = headerWidth.value;
  columnResize.start(event, {
    move: (deltaX) => grid.setHeaderWidth(startWidth + deltaX),
    cancel: () => grid.setHeaderWidth(startWidth),
  });
}
</script>

<template>
  <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Tailwind 3 has no scrollbar-width utility -->
  <div
    ref="scroller"
    class="relative size-full overflow-auto bg-surface-base [scrollbar-width:none]"
  >
    <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    <div
      class="relative"
      :class="fillHeight && 'flex min-h-full flex-col'"
      :style="{ width: `${rowWidth}px` }"
    >
      <div
        v-if="timeline.weekendColumns.length"
        class="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        <div
          v-for="column in timeline.weekendColumns"
          :key="column"
          class="absolute bottom-0 bg-surface-gray-3/20"
          :style="{
            top: `${HEADER_HEIGHT}px`,
            left: `${headerWidth + column * columnWidth}px`,
            width: `${columnWidth}px`,
          }"
        />
      </div>

      <table
        class="relative table-fixed border-separate border-spacing-0"
        :class="fillHeight && 'grow'"
        :style="{ width: `${rowWidth}px` }"
      >
        <thead class="sticky top-0 z-40">
          <tr>
            <th
              class="sticky left-0 z-10 border border-l-0 border-outline-gray-1 bg-surface-base p-3 pl-4.5 text-start text-lg-medium text-ink-gray-7"
              :style="{ ...headerCellStyle, height: `${HEADER_HEIGHT}px` }"
            >
              <div class="flex min-w-0 items-center gap-1.5">
                {{ rowHeaderLabel }}
                <InfoHoverCard v-if="rowHeaderHelp" :help="rowHeaderHelp" />
              </div>
            </th>
            <GanttWeekHeader
              v-for="(week, index) in timeline.weeks"
              :key="index"
              :week="week"
              :column-width="columnWidth"
            />
          </tr>
        </thead>
        <tbody>
          <template v-if="variant === 'team'">
            <GanttEmployeeGroup
              v-for="(row, index) in grid.employeeRows.value"
              :key="row.key"
              :row="row"
              :index="index"
            />
          </template>
          <template v-else>
            <GanttProjectGroup
              v-for="(row, index) in grid.projectRows.value"
              :key="row.key"
              :row="row"
              :index="index"
            />
          </template>
          <tr v-if="fillHeight" aria-hidden="true">
            <th
              class="sticky left-0 z-30 border-r border-outline-gray-1 bg-surface-base"
              :style="headerCellStyle"
            />
            <td
              v-for="(week, index) in timeline.weeks"
              :key="index"
              :colspan="week.days.length"
              class="border-r border-outline-gray-1"
            />
            <td class="w-0 min-w-0 max-w-0 border-0 p-0" />
          </tr>
        </tbody>
      </table>

      <button
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="absolute bottom-0 right-0 z-10 bg-surface-base/50 transition-opacity duration-150 ease-out"
        :class="
          grid.activeEdit.value
            ? 'pointer-events-auto cursor-pointer opacity-100'
            : 'pointer-events-none opacity-0'
        "
        :style="{ top: `${HEADER_HEIGHT}px`, left: `${headerWidth}px` }"
        @click="grid.guard()"
      />

      <div class="pointer-events-none absolute inset-0 z-50">
        <div class="sticky left-0 top-0 h-full w-0">
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize column"
            class="pointer-events-auto absolute inset-y-0 w-1 cursor-col-resize touch-none hover:bg-surface-gray-3"
            :class="columnResize.dragging.value && 'bg-surface-gray-3'"
            :style="{ left: `${headerWidth - 2}px` }"
            @pointerdown="startColumnResize"
          />
        </div>
      </div>
    </div>

    <div
      v-if="loading || hasMore"
      ref="loadingRows"
      role="status"
      aria-label="Loading more"
      class="sticky left-0 flex w-full flex-col items-start gap-px"
    >
      <Skeleton
        v-for="index in LOADING_ROW_COUNT"
        :key="index"
        class="h-15 w-full shrink-0 rounded-none"
      />
    </div>
  </div>
</template>
