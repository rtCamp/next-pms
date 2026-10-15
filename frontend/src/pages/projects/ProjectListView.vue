<script setup lang="ts">
import ProjectListTable from "./ProjectListTable.vue";
import { provideProjectList } from "./useProjectList";

provideProjectList();
</script>

<template>
  <ProjectListTable />
</template>
