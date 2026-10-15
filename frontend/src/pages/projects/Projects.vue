<script setup lang="ts">
import ProjectFilters from "./ProjectFilters.vue";
import ProjectListView from "./ProjectListView.vue";
import ProjectsHeader from "./ProjectsHeader.vue";

defineOptions({ inheritAttrs: false });
</script>

<template>
  <ProjectsHeader />
  <ProjectFilters />
  <ProjectListView />
</template>
