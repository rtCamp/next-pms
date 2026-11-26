<script setup lang="ts">
import { computed } from "vue";
import { HoverCard } from "frappe-ui";
import { BAR_CARD_DELAY_MS, CARD_LEAVE_DELAY_MS } from "./constants";
import GanttAllocationCard from "./GanttAllocationCard.vue";
import GanttBar from "./GanttBar.vue";
import { overlapping, type ProjectRow, type ProjectSummaryBar } from "./rows";
import { formatHours } from "./summary";
import { useGanttGrid } from "./useGanttGrid";

const props = defineProps<{
  bar: ProjectSummaryBar;
  row: ProjectRow;
}>();

const grid = useGanttGrid();
const entries = computed(() =>
  props.row.employees.flatMap((employee) =>
    overlapping(
      employee.allocations,
      props.bar.startDate,
      props.bar.endDate,
    ).map((bar) => ({
      bar,
      employeeName: employee.name,
      employeeImage: employee.image,
    })),
  ),
);

function add() {
  grid.emit("add", {
    projectId: props.row.id,
    projectName: props.row.name,
    customerName: props.row.customer,
    startDate: props.bar.startDate,
    endDate: props.bar.endDate,
  });
}
</script>

<template>
  <HoverCard
    side="bottom"
    align="start"
    :offset="4"
    :hover-delay="BAR_CARD_DELAY_MS"
    :leave-delay="CARD_LEAVE_DELAY_MS"
  >
    <template #trigger>
      <GanttBar
        role="button"
        tabindex="0"
        variant="projectSummary"
        :label="`${formatHours(bar.hours)}h / week`"
        :left="bar.barOffset + grid.headerWidth.value"
        :width="bar.width"
        :crosshatch="bar.tentative"
        :ai="bar.isAiCreated"
      />
    </template>
    <template #default="{ close }">
      <GanttAllocationCard
        :entries="entries"
        addable
        @add="add"
        @close="close"
      />
    </template>
  </HoverCard>
</template>
