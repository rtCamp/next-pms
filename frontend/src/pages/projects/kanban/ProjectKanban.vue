<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Spinner, toast } from "frappe-ui";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/vue";
import { useProjectPhases } from "@/composables/useProjectPhases";
import type { KanbanProjectItem } from "../types";
import KanbanColumn from "./KanbanColumn.vue";
import { useProjectKanban } from "./useProjectKanban";

defineEmits<{ addProject: [phase: string] }>();

const kanban = useProjectKanban();
const projectPhases = useProjectPhases();

type IdsByPhase = Record<string, string[]>;

/** Project ids per doctype phase; projects in any other phase aren't shown. */
function groupIds(): IdsByPhase {
  return Object.fromEntries(
    projectPhases.phases.map(({ phase }) => [
      phase,
      (kanban.data[phase] ?? []).map((project) => project.name),
    ]),
  );
}

const items = ref<IdsByPhase>({});
watch(
  [() => kanban.data, () => projectPhases.phases],
  () => (items.value = groupIds()),
  { immediate: true },
);

const byId = computed(() => {
  const map = new Map<string, KanbanProjectItem>();
  for (const projects of Object.values(kanban.data)) {
    for (const project of projects) map.set(project.name, project);
  }
  return map;
});

function phaseOf(ids: IdsByPhase, projectId: string) {
  return Object.keys(ids).find((phase) => ids[phase]?.includes(projectId));
}

defineExpose({ reload: () => kanban.reload() });

let phaseBeforeDrag: string | undefined;

function onDragStart(event: DragStartEvent) {
  kanban.dragging = true;
  const id = event.operation.source?.id;
  phaseBeforeDrag =
    typeof id === "string" ? phaseOf(items.value, id) : undefined;
}

function onDragOver(event: DragOverEvent) {
  items.value = move(items.value, event);
}

async function onDragEnd(event: DragEndEvent) {
  kanban.dragging = false;
  const projectId = event.operation.source?.id;
  if (event.canceled || typeof projectId !== "string") {
    items.value = groupIds();
    return;
  }
  const phase = phaseOf(items.value, projectId);
  if (!phase || phase === phaseBeforeDrag) return;
  try {
    await kanban.updatePhase(projectId, phase);
  } catch {
    items.value = groupIds();
    const name = byId.value.get(projectId)?.project_name ?? projectId;
    toast.error(`Error updating the phase for ${name}`);
  }
}
</script>

<template>
  <div v-if="!kanban.loaded" class="flex h-64 items-center justify-center">
    <Spinner class="size-6" />
  </div>
  <DragDropProvider
    v-else
    @drag-start="onDragStart"
    @drag-over="onDragOver"
    @drag-end="onDragEnd"
  >
    <div class="flex min-h-0 flex-1 gap-4 overflow-auto px-7">
      <KanbanColumn
        v-for="phase in projectPhases.phases"
        :key="phase.phase"
        :phase="phase"
        :projects="
          (items[phase.phase] ?? []).flatMap((id) => byId.get(id) ?? [])
        "
        @add-project="$emit('addProject', $event)"
      />
    </div>
  </DragDropProvider>
</template>
