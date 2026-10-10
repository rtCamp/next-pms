<script setup lang="ts">
import {
  ACTION_CELL_CLASS,
  CELL_CLASS,
  EMPTY_CELL_CLASS,
  ROW_CLASS,
} from "./constants";
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
  <div :class="ROW_CLASS" data-testid="time-off-row">
    <div class="flex min-w-0 flex-1 items-center gap-2 text-ink-gray-9">
      <span class="flex w-4 shrink-0 items-center">
        <slot name="prefix">
          <span class="lucide-calendar-x-2 size-4" aria-hidden="true" />
        </slot>
      </span>
      <span class="min-w-0 truncate text-base-medium">{{ label }}</span>
    </div>

    <div
      v-for="(entry, index) in timeOffEntries"
      :key="index"
      :class="[CELL_CLASS, 'text-base text-ink-gray-6 lining-nums tabular-nums']"
    >
      <span v-if="entry === ''" :class="EMPTY_CELL_CLASS">-</span>
      <span v-else>{{ entry }}</span>
    </div>

    <div
      :class="[
        CELL_CLASS,
        'text-base-medium text-ink-amber-4 lining-nums tabular-nums',
      ]"
      data-testid="time-off-total"
    >
      {{ totalHours }}
    </div>

    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
