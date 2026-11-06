<script setup lang="ts">
import { computed } from "vue";
import { floatToTime } from "@/utils/format";
import TaskCard from "./TaskCard.vue";
import TaskRow from "./TaskRow.vue";
import { toTaskStatus } from "./constants";
import type { TaskRowTimeEntry, TaskWeekRowProps, TimeEntry } from "./types";
import { computeTaskCells } from "./utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TaskWeekRowProps>(), {
  disabled: false,
  backdateRestrictedBefore: null,
  starred: false,
  hideStarButton: false,
  guard: (action: () => void) => action(),
});

const emit = defineEmits<{
  /** A day's cell was pressed while it accepts time. */
  cellClick: [date: string];
  /** The star button was pressed. */
  star: [];
  /** The task's name was pressed. */
  labelClick: [];
}>();

defineSlots<{
  /** Popover for a day's entries; see `TaskRow`'s `entry` slot. */
  entry?: (props: {
    dayIndex: number;
    date: string;
    /** The task's entries on the day. */
    entries: TimeEntry[];
    /** The day's cell: time, status, lock and rejection reason. */
    cell: TaskRowTimeEntry;
    close: () => void;
    setEngaged: (engaged: boolean) => void;
  }) => unknown;
}>();

const status = computed(() => toTaskStatus(props.task.status));

const week = computed(() =>
  computeTaskCells({
    dates: props.dates,
    task: props.task,
    disabled: props.disabled,
    backdateRestrictedBefore: props.backdateRestrictedBefore,
  }),
);
</script>

<template>
  <TaskRow
    v-bind="$attrs"
    :label="task.subject || task.name"
    :status="status"
    :starred="starred"
    :hide-star-button="hideStarButton"
    :time-entries="week.cells"
    :total-hours="floatToTime(week.total)"
    :guard="guard"
    @cell-click="(_, date) => emit('cellClick', date ?? '')"
    @star="emit('star')"
    @label-click="emit('labelClick')"
  >
    <template #card>
      <TaskCard
        :label="task.subject || task.name"
        :status="status"
        :project-name="task.project_name || undefined"
        :due-date="task.due_date"
        :actual-hours="task.actual_time || 0"
        :estimated-hours="task.expected_time || 0"
      />
    </template>
    <template v-if="$slots.entry" #entry="{ dayIndex, close, setEngaged }">
      <slot
        name="entry"
        :day-index="dayIndex"
        :date="dates[dayIndex]"
        :entries="week.entriesByDay[dayIndex]"
        :cell="week.cells[dayIndex]"
        :close="close"
        :set-engaged="setEngaged"
      />
    </template>
  </TaskRow>
</template>
