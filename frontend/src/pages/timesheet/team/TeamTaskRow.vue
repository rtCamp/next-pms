<script setup lang="ts">
import { TaskWeekRow, type TimesheetTask } from "@/components/Timesheet";
import { useUnsavedChanges } from "@/composables/useUnsavedChanges";
import InlineTimeEntry from "@/pages/timesheet/InlineTimeEntry.vue";

defineProps<{
  /** The week's dates as `YYYY-MM-DD`. */
  dates: string[];
  /** Task ID; the key of the task in the member's week. */
  taskKey: string;
  task: TimesheetTask;
  /** Employee the entries belong to. */
  employeeId: string;
  disabled?: boolean;
  backdateRestrictedBefore?: string | null;
  /** The member's expected hours a day, the most the entry form allows. */
  dailyHours: number;
  /** Hours the member logged per day across the week. */
  hoursPerDay: number[];
}>();

const emit = defineEmits<{ labelClick: [task: string] }>();

const unsavedChanges = useUnsavedChanges();
</script>

<template>
  <TaskWeekRow
    :dates="dates"
    :task="task"
    :disabled="disabled"
    :backdate-restricted-before="backdateRestrictedBefore"
    hide-star-button
    :guard="unsavedChanges.requestGuardedAction"
    @label-click="emit('labelClick', taskKey)"
  >
    <template #entry="{ dayIndex, date, entries, cell, close, setEngaged }">
      <InlineTimeEntry
        :key="`${taskKey}-${date}`"
        :date="date"
        :employee-id="employeeId"
        :task-id="taskKey"
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
