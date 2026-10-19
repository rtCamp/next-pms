<script setup lang="ts">
import { computed } from "vue";
import GanttBar from "./GanttBar.vue";
import type { AllocationBar } from "./rows";
import { useGanttGrid } from "./useGanttGrid";

const props = defineProps<{
  bar: AllocationBar;
}>();

const grid = useGanttGrid();

const variant = computed(() => {
  if (props.bar.fullyReduced) return "empty";
  return props.bar.isAiCreated ? "aiAllocation" : "allocation";
});

const label = computed(() => {
  const days = props.bar.fullNumDays;
  return `${props.bar.hours}h/day for ${days} day${days === 1 ? "" : "s"}`;
});
</script>

<template>
  <GanttBar
    :variant="variant"
    :label="label"
    :left="bar.barOffset + grid.headerWidth.value"
    :width="bar.width"
    :crosshatch="bar.isAiCreated || bar.tentative"
    :billable="bar.billable"
    :ai="bar.isAiCreated"
  />
</template>
