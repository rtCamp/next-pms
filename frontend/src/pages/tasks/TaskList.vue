<script setup lang="ts">
import { ref } from "vue";
import { AddTimeDialog, type AddTimePrefill } from "@/components/AddTime";
import { TaskLogDialog } from "@/components/TaskLog";
import AddTaskDialog from "./AddTaskDialog.vue";
import TaskListFilters from "./TaskListFilters.vue";
import TaskListHeader from "./TaskListHeader.vue";
import TaskListTable from "./TaskListTable.vue";
import type { TaskListItem } from "./types";
import { provideTaskList } from "./useTaskList";

defineOptions({ inheritAttrs: false });

const taskList = provideTaskList();

const dialogOpen = ref(false);
const editingTask = ref<TaskListItem | null>(null);
const openTask = ref<string | null>(null);
const addTimeOpen = ref(false);
const addTimePrefill = ref<AddTimePrefill>({});

function addTask() {
  editingTask.value = null;
  dialogOpen.value = true;
}

function editTask(task: TaskListItem) {
  editingTask.value = task;
  dialogOpen.value = true;
}

function addTime(task: TaskListItem) {
  addTimePrefill.value = {
    project: task.project,
    projectLabel: task.project_name ?? task.project,
    task: task.name,
    taskLabel: task.subject,
  };
  addTimeOpen.value = true;
}
</script>

<template>
  <TaskListHeader @add-task="addTask" />
  <TaskListFilters />
  <TaskListTable
    @edit-task="editTask"
    @open-task="openTask = $event"
    @add-time="addTime"
  />
  <AddTaskDialog
    v-model:open="dialogOpen"
    :task="editingTask"
    @saved="taskList.refresh()"
  />
  <AddTimeDialog v-model:open="addTimeOpen" :prefill="addTimePrefill" />
  <!-- Mounted per open, so each task starts on the default range, as in React. -->
  <TaskLogDialog
    v-if="openTask"
    :task="openTask"
    :open="true"
    @update:open="openTask = null"
  />
</template>
