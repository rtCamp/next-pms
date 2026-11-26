<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import { CELL_WIDTH } from "./constants";
import GanttBar from "./GanttBar.vue";
import { timeoffLabel } from "./summary";
import type { TimeoffPortion } from "./types";

const props = withDefaults(
  defineProps<{
    startDate: Date;
    endDate: Date;
    timeoff?: TimeoffPortion;
    /** A holiday's name; shown instead of "N days off". */
    holiday?: string;
    left: number;
    width: number;
    /** Off when a card opens from the bar instead. */
    tooltip?: boolean;
  }>(),
  { timeoff: "full", holiday: undefined, tooltip: true },
);

const label = computed(
  () =>
    props.holiday ??
    timeoffLabel(props.startDate, props.endDate, props.timeoff),
);
</script>

<template>
  <GanttBar variant="timeoff" :label="label" :left="left" :width="width">
    <Tooltip :text="label" :disabled="!tooltip">
      <div
        class="absolute inset-0 flex w-full items-center justify-center gap-1.5 px-2.5 py-2"
      >
        <span
          class="size-4 shrink-0 text-ink-gray-5"
          :class="holiday ? 'lucide-tree-palm' : 'lucide-calendar-x-2'"
          aria-hidden="true"
        />
        <span
          v-if="width > CELL_WIDTH"
          class="min-w-0 flex-1 truncate text-sm-medium"
        >
          {{ label }}
        </span>
        <span v-else class="sr-only">{{ label }}</span>
      </div>
    </Tooltip>
  </GanttBar>
</template>
