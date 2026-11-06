<script setup lang="ts">
import { Button } from "frappe-ui";
import { BAR_HEIGHT, BAR_MARGIN, CELL_HEIGHT } from "./constants";
import GanttDraftBar from "./GanttDraftBar.vue";
import { useGanttGrid } from "./useGanttGrid";
import type { RowDraft } from "./useRowDraft";

defineProps<{
  draft: RowDraft;
}>();

const grid = useGanttGrid();

function onClick(event: MouseEvent, draft: RowDraft) {
  // A pointer press already started drawing; only the keyboard gets here with detail 0.
  if (event.detail === 0) draft.addAtHovered();
}
</script>

<template>
  <GanttDraftBar v-if="draft.draft.value" :draft="draft" />
  <Button
    v-else-if="draft.canAdd.value && draft.hoveredLeft.value !== null"
    variant="subtle"
    icon="lucide-plus"
    label="Add allocation"
    class="pointer-events-auto absolute"
    :style="{
      left: `${Math.max(draft.hoveredLeft.value + BAR_MARGIN / 2, 0)}px`,
      width: `${Math.max(grid.columnWidth.value - BAR_MARGIN, 0)}px`,
      height: `${BAR_HEIGHT}px`,
      top: `${(CELL_HEIGHT - BAR_HEIGHT) / 2}px`,
    }"
    @pointerdown="draft.startFromButton"
    @click="onClick($event, draft)"
  />
</template>
