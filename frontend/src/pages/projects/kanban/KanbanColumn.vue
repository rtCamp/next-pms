<script setup lang="ts">
import { useTemplateRef } from "vue";
import { Button } from "frappe-ui";
import { useDroppable } from "@dnd-kit/vue";
import { PhaseIcon } from "@/components/PhaseIcon";
import type { ProjectPhase } from "@/composables/useProjectPhases";
import { KANBAN_COLUMN_WIDTH } from "../constants";
import type { KanbanProjectItem } from "../types";
import KanbanCard from "./KanbanCard.vue";

/** `CollisionPriority.Low`: cards win over the column they sit in. */
const COLUMN_COLLISION_PRIORITY = 1;

const props = defineProps<{
  phase: ProjectPhase;
  projects: KanbanProjectItem[];
}>();

defineEmits<{ addProject: [phase: string] }>();

useDroppable({
  id: () => props.phase.phase,
  type: "column",
  accept: "item",
  collisionPriority: COLUMN_COLLISION_PRIORITY,
  element: useTemplateRef("cards"),
});
</script>

<template>
  <section
    class="flex min-h-screen shrink-0 flex-col gap-3"
    :style="{ width: `${KANBAN_COLUMN_WIDTH}px` }"
    :aria-label="phase.phase"
  >
    <div class="flex items-center gap-2 pl-1.5">
      <PhaseIcon :color="phase.color" />
      <h2 class="min-w-0 flex-1 truncate text-base text-ink-gray-7">
        {{ phase.phase }}
      </h2>
      <Button
        variant="ghost"
        size="sm"
        icon="lucide-plus"
        :aria-label="`Add project in ${phase.phase}`"
        @click="$emit('addProject', phase.phase)"
      />
    </div>
    <div ref="cards" class="flex min-h-40 flex-col gap-2.5">
      <KanbanCard
        v-for="(project, index) in projects"
        :key="project.name"
        :project="project"
        :index="index"
        :phase="phase.phase"
      />
    </div>
  </section>
</template>
