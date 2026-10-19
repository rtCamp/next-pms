<script setup lang="ts">
import { TaskLog, useTaskLog } from "@/components/TaskLog";
import { useSession } from "@/session";

const props = defineProps<{
  /** Task to show the log for. */
  task: string;
}>();
const open = defineModel<boolean>("open", { required: true });

const session = useSession();

// The personal page always shows the viewer's own time, whatever their roles.
const { range, details, entries, loading } = useTaskLog({
  task: () => props.task,
  employee: () => session.employee,
});
</script>

<template>
  <TaskLog
    v-model:open="open"
    v-model:range="range"
    view="personal"
    :details="details"
    :entries="entries"
    :loading="loading"
  />
</template>
