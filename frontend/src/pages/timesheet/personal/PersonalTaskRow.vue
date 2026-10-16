<script setup lang="ts">
import { computed } from "vue";
import { TaskWeekRow, type TimesheetTask } from "@/components/Timesheet";
import { useToggleLike } from "@/composables/useToggleLike";
import { usePersonalTimesheet } from "./usePersonalTimesheet";

const props = defineProps<{
  /** The week's dates as `YYYY-MM-DD`. */
  dates: string[];
  /** Task ID; the key of the task in the week. */
  taskKey: string;
  task: TimesheetTask;
  disabled?: boolean;
  backdateRestrictedBefore?: string | null;
}>();

const emit = defineEmits<{ labelClick: [task: string] }>();

const timesheet = usePersonalTimesheet();

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
    @star="like.toggle()"
    @label-click="emit('labelClick', taskKey)"
  />
</template>
