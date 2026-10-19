<script setup lang="ts">
import { computed } from "vue";
import GanttBar from "./GanttBar.vue";
import GanttTimeoffBar from "./GanttTimeoffBar.vue";
import type { EmployeeRow, SummaryBar } from "./rows";
import { capacityStatus } from "./summary";
import { useGanttGrid } from "./useGanttGrid";

const props = defineProps<{
  bar: SummaryBar;
  row: EmployeeRow;
}>();

const grid = useGanttGrid();
const left = computed(() => props.bar.barOffset + grid.headerWidth.value);
const status = computed(() =>
  capacityStatus(props.bar.hours, props.row.capacityHoursPerDay),
);
</script>

<template>
  <GanttBar
    v-if="bar.type === 'free'"
    variant="empty"
    passive
    :label="capacityStatus(0, row.capacityHoursPerDay).label"
    :left="left"
    :width="bar.width"
  />
  <GanttTimeoffBar
    v-else-if="bar.type === 'timeoff'"
    :start-date="bar.startDate"
    :end-date="bar.endDate"
    :timeoff="bar.timeoff"
    :holiday="bar.label"
    :left="left"
    :width="bar.width"
  />
  <GanttBar
    v-else
    :variant="status.variant"
    :label="status.label"
    :left="left"
    :width="bar.width"
    :crosshatch="bar.tentative"
    :billable="bar.billable"
    :ai="bar.isAiCreated"
  />
</template>
