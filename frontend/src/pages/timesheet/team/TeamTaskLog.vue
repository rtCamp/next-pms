<script setup lang="ts">
import { TaskLog, useTaskLog } from "@/components/TaskLog";

const props = defineProps<{
  /** Task to show the log for. */
  task: string;
}>();
const open = defineModel<boolean>("open", { required: true });

const { range, details, entries, loading } = useTaskLog({
  task: () => props.task,
});
</script>

<template>
  <TaskLog
    v-model:open="open"
    v-model:range="range"
    view="team"
    :details="details"
    :entries="entries"
    :loading="loading"
  />
</template>
