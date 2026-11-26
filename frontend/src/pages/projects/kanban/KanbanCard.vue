<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useSortable } from "@dnd-kit/vue/sortable";
import type { KanbanProjectItem } from "../types";
import ProjectCard from "./ProjectCard.vue";

const props = defineProps<{
  project: KanbanProjectItem;
  index: number;
  /** The phase column it sits in. */
  phase: string;
}>();

const { isDragging } = useSortable({
  id: () => props.project.name,
  index: () => props.index,
  group: () => props.phase,
  type: "item",
  accept: "item",
  element: useTemplateRef("card"),
});
</script>

<template>
  <div
    ref="card"
    class="h-full rounded-8 transition-shadow"
    :class="isDragging && 'shadow-xl'"
  >
    <ProjectCard :project="project" />
  </div>
</template>
