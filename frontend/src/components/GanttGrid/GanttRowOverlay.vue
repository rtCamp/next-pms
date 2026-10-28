<script setup lang="ts">
import { CELL_HEIGHT } from "./constants";
import { useGanttGrid } from "./useGanttGrid";

withDefaults(defineProps<{ height?: number }>(), { height: CELL_HEIGHT });

defineSlots<{
  /** The row's bars, positioned from the row's left edge. */
  default?: () => unknown;
}>();

const grid = useGanttGrid();
</script>

<!-- A zero-width last cell whose layer reaches back over the whole row, so bars
     can be placed in px without breaking the table's columns. -->
<template>
  <td class="relative w-0 min-w-0 max-w-0 border-0 p-0">
    <div
      class="pointer-events-none absolute top-0"
      :style="{
        left: `${-grid.rowWidth.value}px`,
        width: `${grid.rowWidth.value}px`,
        height: `${height}px`,
      }"
    >
      <slot />
    </div>
  </td>
</template>
