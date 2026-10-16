<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import { FilledStarIcon } from "@/icons";
import LevelLabels from "./LevelLabels.vue";
import TimeCell from "./TimeCell.vue";
import {
  ACTION_CELL_CLASS,
  BUTTON_CELL_CLASS,
  CELL_CLASS,
  ROW_CLASS,
  totalHoursClass,
} from "./constants";
import type { TotalRowProps } from "./types";

const props = withDefaults(defineProps<TotalRowProps>(), {
  starred: false,
  totalHours: "",
  disabled: false,
});

const emit = defineEmits<{
  /** The star button was pressed to import or clear liked tasks. */
  star: [];
  /** A day's add-time button was pressed; `date` is the cell's `date`. */
  cellClick: [dayIndex: number, date: string | undefined];
}>();

defineSlots<{
  /** Replaces the star button. */
  prefix?: () => unknown;
}>();

const starLabel = computed(() =>
  props.starred ? "Clear imported tasks" : "Import liked tasks to this week",
);
</script>

<template>
  <div :class="ROW_CLASS">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <span class="flex w-4 shrink-0 items-center justify-center">
        <slot name="prefix">
          <Tooltip :text="starLabel">
            <button
              type="button"
              class="flex size-4 items-center justify-center rounded-4 hover:bg-surface-gray-2"
              :aria-label="starLabel"
              @click="emit('star')"
            >
              <FilledStarIcon
                v-if="starred"
                class="size-4 text-ink-amber-5"
                aria-hidden="true"
              />
              <span
                v-else
                class="lucide-star-off size-4 -scale-x-100 text-ink-gray-4"
                aria-hidden="true"
              />
            </button>
          </Tooltip>
        </slot>
      </span>
      <LevelLabels :levels="levels" variant="total" />
    </div>

    <div
      v-for="(entry, index) in totalTimeEntries"
      :key="index"
      :class="BUTTON_CELL_CLASS"
    >
      <TimeCell
        :time="entry.time"
        :disabled="disabled || entry.disabled"
        class="text-base-medium text-ink-gray-8"
        @click="emit('cellClick', index, entry.date)"
      />
    </div>

    <div :class="CELL_CLASS">
      <span :class="totalHoursClass({ theme: totalHoursTheme })">
        {{ totalHours }}
      </span>
    </div>

    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
