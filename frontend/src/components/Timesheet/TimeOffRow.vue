<script setup lang="ts">
import { Tooltip } from "frappe-ui";
import { ACTION_CELL_CLASS, CELL_CLASS, ROW_CLASS } from "./constants";
import type { TimeOffRowProps } from "./types";

withDefaults(defineProps<TimeOffRowProps>(), {
  label: "Time-off",
  totalHours: "",
});

defineSlots<{
  /** Icon before the label; defaults to a crossed-out calendar. */
  prefix?: () => unknown;
}>();
</script>

<template>
  <div :class="ROW_CLASS">
    <div class="flex min-w-0 flex-1 items-center gap-2 text-ink-gray-8">
      <span class="flex w-4 shrink-0 items-center">
        <slot name="prefix">
          <span class="lucide-calendar-x-2 size-4" aria-hidden="true" />
        </slot>
      </span>
      <span class="min-w-0 truncate text-base-medium">{{ label }}</span>
    </div>

    <Tooltip
      v-for="(entry, index) in timeOffEntries"
      :key="index"
      :text="entry.holidayDescription ?? ''"
      :disabled="!entry.holidayDescription"
    >
      <div
        :class="[
          CELL_CLASS,
          'text-base lining-nums tabular-nums',
          entry.holiday ? 'text-ink-gray-4' : 'text-ink-gray-6',
        ]"
      >
        <span
          v-if="entry.time === ''"
          class="flex-1 text-center text-ink-gray-4"
        >
          -
        </span>
        <span v-else>{{ entry.time }}</span>
        <span v-if="entry.holidayDescription" class="sr-only">
          {{ entry.holidayDescription }}
        </span>
      </div>
    </Tooltip>

    <div
      :class="[
        CELL_CLASS,
        'text-base-medium text-ink-amber-8 lining-nums tabular-nums',
      ]"
    >
      {{ totalHours }}
    </div>

    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
