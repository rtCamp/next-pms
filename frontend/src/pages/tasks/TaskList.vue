<script setup lang="ts">
import TaskListFilters from "./TaskListFilters.vue";
import TaskListHeader from "./TaskListHeader.vue";
import TaskListTable from "./TaskListTable.vue";
import { provideTaskList } from "./useTaskList";

provideTaskList();
</script>

<template>
  <TaskListHeader />
  <TaskListFilters />
  <TaskListTable />
</template>
