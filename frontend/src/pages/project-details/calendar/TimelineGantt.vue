<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { Spinner } from "frappe-ui";
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  DAY_HEADER_HEIGHT,
  WEEK_LABEL_HEIGHT,
} from "@/components/GanttGrid";
import { cn } from "@/utils/cn";
import { ganttItems, ganttPosition, monthTimeline } from "./calendar";
import GanttBar from "./GanttBar.vue";
import { useTimeline } from "./useTimeline";

const { month, filteredItems, monthLoading, monthError } = useTimeline();

const timeline = computed(() => monthTimeline(month.value));
const totalWidth = computed(() => timeline.value.columnCount * CELL_WIDTH);
const days = computed(() =>
  timeline.value.weeks.flatMap((week) =>
    week.days.map((day) => ({
      ...day,
      inMonth: day.date.getMonth() === month.value.getMonth(),
    })),
  ),
);
const rows = computed(() =>
  ganttItems(filteredItems.value, timeline.value).flatMap((item) => {
    const position = ganttPosition(item, timeline.value);
    return position ? [{ item, position }] : [];
  }),
);
const separators = computed(() =>
  timeline.value.weeks
    .slice(0, -1)
    .map((_, index) => (index + 1) * 7 * CELL_WIDTH),
);

const scroller = useTemplateRef<HTMLElement>("scroller");
const moreBelow = ref(false);

function checkScroll() {
  const element = scroller.value;
  if (!element) return;
  const atBottom =
    element.scrollTop + element.clientHeight >= element.scrollHeight - 2;
  moreBelow.value = !atBottom && element.scrollHeight > element.clientHeight;
}

let observer: ResizeObserver | undefined;
onMounted(() => {
  observer = new ResizeObserver(checkScroll);
  if (scroller.value) observer.observe(scroller.value);
  checkScroll();
});
onBeforeUnmount(() => observer?.disconnect());
watch(rows, () => requestAnimationFrame(checkScroll), { flush: "post" });
</script>

<template>
  <div class="relative">
    <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Tailwind 3 has no scrollbar-width utility -->
    <div
      ref="scroller"
      class="max-h-112 overflow-auto [scrollbar-width:none]"
      @scroll.passive="checkScroll"
    >
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
      <div :style="{ minWidth: `${totalWidth}px` }">
        <div
          class="sticky top-0 z-20 flex border-t border-outline-gray-1 bg-surface-base"
          :style="{ height: `${WEEK_LABEL_HEIGHT}px` }"
        >
          <div
            v-for="(week, index) in timeline.weeks"
            :key="week.label"
            :class="
              cn(
                'flex items-center justify-center px-2 text-xs text-ink-gray-4',
                index < timeline.weeks.length - 1 &&
                  'border-r border-outline-gray-1',
              )
            "
            :style="{ width: `${week.days.length * CELL_WIDTH}px` }"
          >
            <span class="truncate">{{ week.label }}</span>
          </div>
        </div>
        <div
          class="sticky z-20 flex border-b border-outline-gray-1 bg-surface-base"
          :style="{
            top: `${WEEK_LABEL_HEIGHT}px`,
            height: `${DAY_HEADER_HEIGHT}px`,
          }"
        >
          <div
            v-for="day in days"
            :key="day.date.getTime()"
            :class="
              cn(
                'relative flex shrink-0 items-center justify-center',
                day.isWeekend && 'bg-surface-gray-1/50',
                day.date.getDay() === 0 && 'border-r border-outline-gray-1',
              )
            "
            :style="{
              width: `${CELL_WIDTH}px`,
              height: `${DAY_HEADER_HEIGHT}px`,
            }"
          >
            <span
              :aria-current="day.isToday ? 'date' : undefined"
              :class="
                cn(
                  'px-1.5 py-0.5 text-xs',
                  day.inMonth ? 'text-ink-gray-4' : 'text-ink-gray-3',
                  day.isToday && 'rounded-3 bg-surface-gray-10 text-ink-base',
                )
              "
            >
              {{ day.date.getDate() }}
            </span>
          </div>
        </div>
        <div class="relative">
          <div
            v-for="column in timeline.weekendColumns"
            :key="column"
            class="pointer-events-none absolute inset-y-0 bg-surface-gray-1/50"
            :style="{
              left: `${column * CELL_WIDTH}px`,
              width: `${CELL_WIDTH}px`,
            }"
          />
          <div
            v-for="x in separators"
            :key="x"
            class="pointer-events-none absolute inset-y-0 border-l border-outline-gray-1"
            :style="{ left: `${x - 1}px` }"
          />
          <div
            v-for="row in rows"
            :key="row.item.name"
            class="relative"
            :style="{ height: `${CELL_HEIGHT}px` }"
          >
            <GanttBar
              :item="row.item"
              :position="row.position"
              :total-width="totalWidth"
            />
          </div>
          <div
            v-if="!rows.length && monthLoading"
            class="relative z-10 flex justify-center py-10"
          >
            <Spinner class="size-5" />
          </div>
          <p
            v-else-if="!rows.length && !monthError"
            class="relative z-10 py-10 text-center text-sm text-ink-gray-4"
          >
            No items for this period
          </p>
        </div>
      </div>
    </div>
    <div
      v-if="moreBelow"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-surface-base to-transparent pb-2 pt-6"
    >
      <span class="flex items-center gap-1 text-base text-ink-gray-4">
        <span class="lucide-arrow-down size-4" aria-hidden="true" />
        More
      </span>
    </div>
  </div>
</template>
