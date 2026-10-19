<script setup lang="ts">
import GanttBar from "./GanttBar.vue";
import type { ProjectSummaryBar } from "./rows";
import { formatHours } from "./summary";
import { useGanttGrid } from "./useGanttGrid";

defineProps<{
  bar: ProjectSummaryBar;
}>();

const grid = useGanttGrid();
</script>

<template>
  <GanttBar
    variant="projectSummary"
    :label="`${formatHours(bar.hours)}h / week`"
    :left="bar.barOffset + grid.headerWidth.value"
    :width="bar.width"
    :crosshatch="bar.tentative"
    :ai="bar.isAiCreated"
  />
</template>
