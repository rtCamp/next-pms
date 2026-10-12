<script setup lang="ts">
import { ref } from "vue";
import AddTaskDialog from "./AddTaskDialog.vue";
import TaskListFilters from "./TaskListFilters.vue";
import TaskListHeader from "./TaskListHeader.vue";
import TaskListTable from "./TaskListTable.vue";
import type { TaskListItem } from "./types";
import { provideTaskList } from "./useTaskList";

const taskList = provideTaskList();

const dialogOpen = ref(false);
const editingTask = ref<TaskListItem | null>(null);

function addTask() {
  editingTask.value = null;
  dialogOpen.value = true;
}

function editTask(task: TaskListItem) {
  editingTask.value = task;
  dialogOpen.value = true;
}
</script>

<template>
  <TaskListHeader @add-task="addTask" />
  <TaskListFilters />
  <TaskListTable @edit-task="editTask" />
  <AddTaskDialog
    v-model:open="dialogOpen"
    :task="editingTask"
    @saved="taskList.refresh()"
  />
</template>
