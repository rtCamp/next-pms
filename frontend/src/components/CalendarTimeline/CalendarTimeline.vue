<script setup lang="ts">
import { computed } from "vue";
import { Button, dayjs } from "frappe-ui";
import { getRangeLabel, getVisibleDays } from "../../utils/date";
import { DEFAULT_VISIBLE_DAYS, WEEKEND_DAY_INDICES } from "./constants";
import EventChip from "./EventChip.vue";
import type { CalendarTimelineEvent, CalendarTimelineProps } from "./types";

const props = withDefaults(defineProps<CalendarTimelineProps>(), {
  days: DEFAULT_VISIBLE_DAYS,
});

defineEmits<{ prev: []; next: []; today: [] }>();

defineSlots<{
  /** Replaces the whole built-in header (range label, navigation, filter). */
  header?: () => unknown;
  /** Extra controls after the navigation buttons, e.g. a project filter. */
  filter?: () => unknown;
}>();

const label = computed(
  () => props.rangeLabel ?? getRangeLabel(props.rangeStart, props.days),
);

const eventsByDay = computed(() => {
  const grouped = new Map<string, CalendarTimelineEvent[]>();
  for (const event of props.events) {
    const existing = grouped.get(event.date);
    if (existing) existing.push(event);
    else grouped.set(event.date, [event]);
  }
  return grouped;
});

const visibleDays = computed(() =>
  getVisibleDays(props.rangeStart, props.days).map((date) => {
    const day = dayjs(date);
    return {
      key: day.format("YYYY-MM-DD"),
      weekday: day.format("ddd"),
      dayOfMonth: day.format("D"),
      fullLabel: day.format("dddd, MMMM D, YYYY"),
      isWeekend: WEEKEND_DAY_INDICES.includes(day.day()),
      isToday: Boolean(props.today && day.isSame(props.today, "day")),
      events: eventsByDay.value.get(day.format("YYYY-MM-DD")) ?? [],
    };
  }),
);

const columnStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.days}, minmax(0, 1fr))`,
}));
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
      <slot name="header">
        <div
          class="flex items-center gap-1 text-base font-medium text-ink-gray-8"
        >
          <span>{{ label }}</span>
          <span
            class="lucide-chevron-down size-4 text-ink-gray-5"
            aria-hidden="true"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              icon="lucide-chevron-left"
              label="Previous range"
              @click="$emit('prev')"
            />
            <Button variant="outline" label="Today" @click="$emit('today')" />
            <Button
              variant="ghost"
              icon="lucide-chevron-right"
              label="Next range"
              @click="$emit('next')"
            />
          </div>
          <slot name="filter" />
        </div>
      </slot>
    </div>

    <div class="overflow-hidden">
      <div class="grid" :style="columnStyle" aria-hidden="true">
        <div
          v-for="day in visibleDays"
          :key="`weekday-${day.key}`"
          class="py-2 text-center text-base text-ink-gray-6"
        >
          {{ day.weekday }}
        </div>
      </div>

      <div class="grid border-t border-outline-gray-1" :style="columnStyle">
        <div
          v-for="day in visibleDays"
          :key="day.key"
          role="group"
          :aria-label="day.fullLabel"
          :aria-current="day.isToday ? 'date' : undefined"
          class="flex min-h-[140px] flex-col gap-0.5 border-b border-l border-outline-gray-1 py-px pl-0.5 pr-px first:border-l-0"
          :class="day.isWeekend ? 'bg-surface-gray-1' : 'bg-surface-base'"
        >
          <div class="flex justify-end p-0.5">
            <span
              class="flex h-7 min-w-7 items-center justify-center px-1 text-base"
              :class="
                day.isToday
                  ? 'rounded-6 bg-surface-red-7 text-ink-base dark:text-ink-red-9'
                  : 'text-ink-gray-6'
              "
              aria-hidden="true"
            >
              {{ day.dayOfMonth }}
            </span>
          </div>
          <EventChip
            v-for="event in day.events"
            :key="event.id"
            :title="event.title"
            :subtitle="event.subtitle"
            :color="event.color"
          />
        </div>
      </div>
    </div>
  </div>
</template>
