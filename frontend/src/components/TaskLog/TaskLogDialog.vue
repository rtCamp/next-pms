<script setup lang="ts">
import { computed } from "vue";
import { useSession } from "@/session";
import TaskLog from "./TaskLog.vue";
import { useTaskLog } from "./useTaskLog";

const props = defineProps<{
  /** Task name to show the log for. */
  task: string;
}>();
const open = defineModel<boolean>("open", { required: true });

/** Roles that see everyone's time on the task; others see only their own. */
const TEAM_VIEW_ROLES = ["Projects Manager", "Timesheet Manager"];

const session = useSession();
const view = computed(() =>
  session.hasAnyRole(TEAM_VIEW_ROLES) ? "team" : "personal",
);

const { range, details, entries, loading } = useTaskLog({
  task: () => props.task,
  employee: () => (view.value === "personal" ? session.employee : null),
});
</script>

<template>
  <TaskLog
    v-model:open="open"
    v-model:range="range"
    :view="view"
    :details="details"
    :entries="entries"
    :loading="loading"
  />
</template>
