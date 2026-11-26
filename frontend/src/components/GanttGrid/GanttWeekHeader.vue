<script setup lang="ts">
import { dayjs } from "frappe-ui";
import { DAY_HEADER_HEIGHT, WEEK_LABEL_HEIGHT } from "./constants";
import type { TimelineWeek } from "./geometry";

defineProps<{
  week: TimelineWeek;
  columnWidth: number;
}>();
</script>

<template>
  <th
    :colspan="week.days.length"
    class="border border-l-0 border-outline-gray-1 bg-surface-base p-0 font-normal"
    :style="{
      width: `${week.days.length * columnWidth}px`,
      maxWidth: `${week.days.length * columnWidth}px`,
    }"
  >
    <div
      class="flex items-center justify-center bg-surface-base p-2"
      :style="{ height: `${WEEK_LABEL_HEIGHT}px` }"
    >
      <span class="truncate text-xs text-ink-gray-4">{{ week.label }}</span>
    </div>
    <div class="flex">
      <div
        v-for="day in week.days"
        :key="day.date.getTime()"
        class="relative flex shrink-0 items-center justify-center"
        :class="{
          'bg-surface-gray-3/30': day.isWeekend,
          'rounded-tl-6': day.isWeekendStart,
          'rounded-tr-6': day.isWeekendEnd,
        }"
        :style="{
          width: `${columnWidth}px`,
          height: `${DAY_HEADER_HEIGHT}px`,
        }"
      >
        <span
          class="px-1.5 py-0.5 text-xs"
          :class="
            day.isToday
              ? 'rounded-3 bg-surface-gray-10 text-ink-base'
              : 'text-ink-gray-4'
          "
          :aria-current="day.isToday ? 'date' : undefined"
        >
          {{ dayjs(day.date).format("D") }}
        </span>
        <span
          class="absolute bottom-0 right-0 size-1 border-r border-outline-elevation-2"
          aria-hidden="true"
        />
      </div>
    </div>
  </th>
</template>
