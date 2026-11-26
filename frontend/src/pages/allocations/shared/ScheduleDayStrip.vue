<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from "vue";
import { DayChip } from "@/components/DayChip";
import type { ScheduleDay } from "./schedule";

const props = defineProps<{
  days: ScheduleDay[];
  selection: string[];
  /** Shown beside a short strip, or under a long one. */
  recurrenceHelperText?: string;
}>();

const emit = defineEmits<{ toggle: [date: string] }>();

const scroller = useTemplateRef<HTMLElement>("scroller");
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateFades() {
  const element = scroller.value;
  if (!element) return;
  canScrollLeft.value = element.scrollLeft > 0;
  canScrollRight.value =
    element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
}

watch(
  () => props.days,
  () => nextTick(updateFades),
  { immediate: true },
);

function stateOf(day: ScheduleDay) {
  if (day.isLocked) return "disabled" as const;
  return props.selection.includes(day.date) ? "active" : "default";
}
</script>

<template>
  <div
    class="relative -mx-6 pb-1.5"
    :class="
      recurrenceHelperText &&
      days.length <= 3 &&
      'flex items-center justify-between gap-3'
    "
  >
    <div
      class="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-surface-base to-transparent transition-opacity"
      :class="canScrollLeft ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
    />
    <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Tailwind 3 has no scrollbar-width utility -->
    <div
      ref="scroller"
      class="flex items-start gap-1 overflow-x-auto px-6 py-1.5 [scrollbar-width:none]"
      @scroll="updateFades"
    >
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
      <DayChip
        v-for="day in days"
        :key="day.date"
        :day-label="day.dayLabel"
        :day-number="day.dayNumber"
        :month-label="day.monthLabel"
        :is-month-boundary="day.isMonthBoundary"
        :state="stateOf(day)"
        :tooltip="day.dayOffTooltip"
        @click="emit('toggle', day.date)"
      />
    </div>
    <p
      v-if="recurrenceHelperText && days.length <= 3"
      class="shrink-0 pr-6 text-sm text-ink-gray-4"
    >
      {{ recurrenceHelperText }}
    </p>
    <div
      v-else
      class="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-surface-base to-transparent transition-opacity"
      :class="canScrollRight ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
    />
  </div>
</template>
