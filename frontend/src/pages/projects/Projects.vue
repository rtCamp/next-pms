<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import AddProjectDialog from "./AddProjectDialog.vue";
import ProjectFilters from "./ProjectFilters.vue";
import ProjectListView from "./ProjectListView.vue";
import ProjectsHeader from "./ProjectsHeader.vue";

defineOptions({ inheritAttrs: false });

const listView = useTemplateRef("listView");
const addProjectOpen = ref(false);
const addProjectPhase = ref<string>();

function addProject(phase?: string) {
  addProjectPhase.value = phase;
  addProjectOpen.value = true;
}
</script>

<template>
  <ProjectsHeader @add-project="addProject()" />
  <ProjectFilters />
  <ProjectListView ref="listView" />
  <AddProjectDialog
    v-model:open="addProjectOpen"
    :phase="addProjectPhase"
    @saved="listView?.refresh()"
  />
</template>
