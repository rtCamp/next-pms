<script setup lang="ts">
import { computed, ref } from "vue";
import { Skeleton, dayjs } from "frappe-ui";
import {
  CalendarTimeline,
  DEFAULT_VISIBLE_DAYS,
  getWeekStart,
} from "@/components/CalendarTimeline";
import { InfoHoverCard, type FieldHelp } from "@/components/InfoHoverCard";
import { useSavedState } from "@/composables/useSavedState";
import { CALENDAR_PROJECTS_KEY } from "@/pages/dashboard/constants";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import WidgetFilter from "@/pages/dashboard/WidgetFilter.vue";
import {
  calendarEvents,
  calendarRangeLabel,
  projectOptions,
  type CalendarItem,
} from "./calendarEvents";

defineProps<{ help: FieldHelp }>();

const rangeStart = ref(getWeekStart(new Date()));
const today = new Date();
const selectedProjects = useSavedState<string[]>(CALENDAR_PROJECTS_KEY, []);

const items = useDashboardCall<{ data: CalendarItem[] }>(
  "get_calendar_timeline_items",
  () => ({
    from_date: dayjs(rangeStart.value).format("YYYY-MM-DD"),
    to_date: dayjs(rangeStart.value)
      .add(DEFAULT_VISIBLE_DAYS, "day")
      .format("YYYY-MM-DD"),
  }),
);

const rows = computed(() => items.data?.data ?? []);
const options = computed(() => projectOptions(rows.value));
const events = computed(() =>
  calendarEvents(rows.value, selectedProjects.value),
);
const columnStyle = {
  gridTemplateColumns: `repeat(${DEFAULT_VISIBLE_DAYS}, minmax(0, 1fr))`,
};
const rangeLabel = computed(() =>
  calendarRangeLabel(rangeStart.value, DEFAULT_VISIBLE_DAYS),
);
</script>

<template>
  <div v-if="items.loading" class="flex flex-col gap-3 p-4" aria-busy="true">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <Skeleton class="h-6 w-44" />
      <div class="flex items-center gap-2">
        <Skeleton class="h-8 w-28" />
        <Skeleton class="h-8 w-32" />
      </div>
    </div>
    <div class="grid overflow-hidden rounded-6" :style="columnStyle">
      <div
        v-for="day in DEFAULT_VISIBLE_DAYS"
        :key="day"
        class="flex min-h-35 flex-col gap-2 border-l border-t border-outline-gray-1 p-2"
      >
        <Skeleton class="h-4 w-6 self-end" />
        <Skeleton class="h-8 w-full" />
      </div>
    </div>
  </div>
  <CalendarTimeline
    v-else
    v-model:range-start="rangeStart"
    :events="events"
    :today="today"
    :range-label="rangeLabel"
  >
    <template #title-suffix>
      <InfoHoverCard :help="help" />
    </template>
    <template #filter>
      <WidgetFilter
        v-model="selectedProjects"
        noun="project"
        :options="options"
      />
    </template>
  </CalendarTimeline>
</template>
