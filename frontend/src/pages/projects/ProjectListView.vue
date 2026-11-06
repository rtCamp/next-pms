<script setup lang="ts">
import ProjectListTable from "./ProjectListTable.vue";
import { provideProjectList } from "./useProjectList";

const projectList = provideProjectList();

defineExpose({ refresh: () => projectList.refresh() });
</script>

<template>
  <ProjectListTable />
</template>
