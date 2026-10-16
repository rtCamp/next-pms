<script setup lang="ts">
import { computed } from "vue";
import { TaskWeekRow, type TimesheetTask } from "@/components/Timesheet";
import { useToggleLike } from "@/composables/useToggleLike";
import { useUnsavedChanges } from "@/composables/useUnsavedChanges";
import { useSession } from "@/session";
import InlineTimeEntry from "@/pages/timesheet/InlineTimeEntry.vue";
import { usePersonalTimesheet } from "./usePersonalTimesheet";

const props = defineProps<{
  /** The week's dates as `YYYY-MM-DD`. */
  dates: string[];
  /** Task ID; the key of the task in the week. */
  taskKey: string;
  task: TimesheetTask;
  disabled?: boolean;
  backdateRestrictedBefore?: string | null;
  /** Hours expected a day, the most the entry form allows. */
  dailyHours: number;
  /** Hours logged per day across the week's tasks and time off. */
  hoursPerDay: number[];
}>();

const emit = defineEmits<{ labelClick: [task: string] }>();

const timesheet = usePersonalTimesheet();
const session = useSession();
const unsavedChanges = useUnsavedChanges();

const like = useToggleLike({
  doctype: "Task",
  name: () => props.taskKey,
  liked: () => timesheet.likedTasks.some((task) => task.name === props.taskKey),
  onToggled: () => timesheet.refetchLikedTasks(),
});

const starred = computed(() => like.liked);
</script>

<template>
  <TaskWeekRow
    :dates="dates"
    :task="task"
    :disabled="disabled"
    :backdate-restricted-before="backdateRestrictedBefore"
    :starred="starred"
    :guard="unsavedChanges.requestGuardedAction"
    @star="like.toggle()"
    @label-click="emit('labelClick', taskKey)"
  >
    <template #entry="{ dayIndex, date, entries, cell, close, setEngaged }">
      <InlineTimeEntry
        :key="`${taskKey}-${date}`"
        :date="date"
        :employee="session.employee ?? ''"
        :task-key="taskKey"
        :entries="entries"
        :cell="cell"
        :disabled="cell.disabled"
        :daily-working-hours="dailyHours"
        :total-used-hours-in-day="hoursPerDay[dayIndex]"
        @close="close"
        @engaged="setEngaged"
      />
    </template>
  </TaskWeekRow>
</template>
