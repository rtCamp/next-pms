<script setup lang="ts">
import { computed } from "vue";
import { CELL_HEIGHT } from "./constants";
import GanttRowDraft from "./GanttRowDraft.vue";
import GanttRowOverlay from "./GanttRowOverlay.vue";
import type { BarMetrics } from "./geometry";
import { useGanttGrid } from "./useGanttGrid";
import { useRowDraft, type DraftTarget } from "./useRowDraft";

const props = defineProps<{
  /** The row is open; while it animates closed it can't be reached. */
  visible: boolean;
  /** The last child with no add row below it draws the group's bottom border. */
  bottomBorder: boolean;
  /** Bars that take their days, so a new allocation can't be drawn there. */
  occupied: BarMetrics[];
  /** Who and what an allocation drawn in the row is for. */
  target: DraftTarget;
}>();

defineSlots<{
  /** The row header cell, at `height`. */
  header: (props: { height: number }) => unknown;
  /** The row's bars, rendered only while it is open. */
  default?: () => unknown;
}>();

const grid = useGanttGrid();
const height = computed(() => (props.visible ? CELL_HEIGHT : 0));
const draft = useRowDraft({
  enabled: () => grid.hasRoleAccess.value && props.visible,
  occupied: () => props.occupied,
  target: () => props.target,
});
</script>

<template>
  <tr
    class="touch-pan-y"
    :class="!visible && 'pointer-events-none'"
    :aria-hidden="!visible || undefined"
    @pointermove="draft.onPointerMove"
    @pointerdown="draft.onPointerDown"
    @pointerleave="draft.onPointerLeave"
  >
    <slot name="header" :height="height" />
    <td
      v-for="(week, index) in grid.timeline.value.weeks"
      :key="index"
      :colspan="week.days.length"
      class="overflow-hidden bg-surface-gray-1/50 transition-all duration-200 ease-in-out"
      :class="{
        'border-r border-outline-gray-1': visible,
        'border-b border-outline-gray-1': visible && bottomBorder,
      }"
      :style="{ height: `${height}px` }"
    />
    <GanttRowOverlay :height="height">
      <slot v-if="visible" />
      <GanttRowDraft :draft="draft" />
    </GanttRowOverlay>
  </tr>
</template>
