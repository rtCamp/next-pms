<script setup lang="ts">
import { HoverCard } from "frappe-ui";
import { FilledStarIcon } from "../../../icons";
import TaskRowCell from "./TaskRowCell.vue";
import {
  ACTION_CELL_CLASS,
  CELL_CLASS,
  ROW_CLASS,
  TASK_STATUS_ICON,
  TASK_STATUS_ICON_CLASS,
  TASK_STATUS_LABEL,
} from "./constants";
import type { TaskRowProps } from "./types";

const props = withDefaults(defineProps<TaskRowProps>(), {
  starred: false,
  totalHours: "",
  status: "open",
});

const emit = defineEmits<{
  /** A day's cell was clicked. */
  cellClick: [taskIndex: number | undefined, dayIndex: number];
}>();

defineSlots<{
  /** Card shown when hovering a day's cell. */
  popover?: (props: { taskIndex: number | undefined; dayIndex: number }) => unknown;
}>();

function onCellClick(dayIndex: number) {
  emit("cellClick", props.taskIndex, dayIndex);
}
</script>

<template>
  <div :class="ROW_CLASS" data-testid="task-row">
    <div class="flex min-w-0 flex-1 items-center">
      <div class="flex min-w-0 items-center gap-2">
        <span
          :class="[
            TASK_STATUS_ICON[status],
            TASK_STATUS_ICON_CLASS[status],
            'size-4',
          ]"
          role="img"
          :aria-label="TASK_STATUS_LABEL[status]"
        />
        <span class="min-w-0 truncate text-base-medium">{{ label }}</span>
        <FilledStarIcon
          v-if="starred"
          class="size-4 shrink-0 text-ink-amber-2"
          role="img"
          aria-label="Starred"
        />
      </div>
    </div>

    <div
      v-for="(entry, index) in timeEntries"
      :key="index"
      :class="[CELL_CLASS, '!pr-0 text-base text-ink-gray-6']"
    >
      <HoverCard
        v-if="$slots.popover"
        side="bottom"
        align="end"
        :offset="8"
      >
        <template #trigger>
          <TaskRowCell :entry="entry" @click="onCellClick(index)" />
        </template>
        <slot name="popover" :task-index="taskIndex" :day-index="index" />
      </HoverCard>
      <TaskRowCell v-else :entry="entry" @click="onCellClick(index)" />
    </div>

    <div
      :class="[CELL_CLASS, 'text-base text-ink-gray-6 lining-nums tabular-nums']"
    >
      {{ totalHours }}
    </div>

    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
