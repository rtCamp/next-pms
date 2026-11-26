<script setup lang="ts">
import { computed } from "vue";
import { dayjs } from "frappe-ui";
import { cn } from "@/utils/cn";
import { calendarWeeks, dateKey, itemsByDate } from "./calendar";
import { DAY_HEADERS } from "./constants";
import EventPill from "./EventPill.vue";
import { useTimeline } from "./useTimeline";

const { month, selectedDate, filteredItems } = useTimeline();

const today = dateKey(new Date());
const weeks = computed(() =>
  calendarWeeks(month.value).map((week) =>
    week.map((date, index) => ({
      key: dateKey(date),
      day: date.getDate(),
      label: dayjs(date).format("dddd, D MMMM YYYY"),
      inMonth: dayjs(date).isSame(month.value, "month"),
      isWeekend: index >= 5,
    })),
  ),
);
const byDate = computed(() => itemsByDate(filteredItems.value));
</script>

<template>
  <div role="table" aria-label="Month" class="flex flex-col">
    <div role="row" class="grid grid-cols-7 border-b border-outline-gray-1">
      <div
        v-for="day in DAY_HEADERS"
        :key="day"
        role="columnheader"
        class="py-2 text-center text-base text-ink-gray-6"
      >
        {{ day }}
      </div>
    </div>
    <div role="rowgroup" class="flex flex-1 flex-col">
      <div
        v-for="week in weeks"
        :key="week[0].key"
        role="row"
        class="grid grid-cols-7 border-b border-outline-gray-1 last:border-b-0"
      >
        <div
          v-for="day in week"
          :key="day.key"
          role="cell"
          :aria-label="
            day.key === selectedDate ? `${day.label}, selected` : day.label
          "
          :aria-current="day.key === today ? 'date' : undefined"
          :class="
            cn(
              'flex min-h-17.5 flex-col gap-1 border-r border-outline-gray-1 p-1.5 last:border-r-0',
              day.key === selectedDate && day.key !== today
                ? 'bg-surface-blue-1'
                : day.isWeekend && 'bg-surface-gray-1 dark:bg-surface-gray-2',
            )
          "
        >
          <div class="flex justify-end">
            <span
              class="flex size-6 items-center justify-center rounded-4 text-base"
              :class="
                day.key === today
                  ? 'bg-surface-red-7 text-ink-base dark:text-ink-gray-9'
                  : day.key === selectedDate
                    ? 'ring-1 ring-outline-blue-1'
                    : day.inMonth
                      ? 'text-ink-gray-6'
                      : 'text-ink-gray-4'
              "
            >
              {{ day.day }}
            </span>
          </div>
          <div class="flex flex-col gap-0.5">
            <EventPill
              v-for="item in byDate.get(day.key) ?? []"
              :key="item.name"
              :item="item"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
