<script setup lang="ts">
import { computed } from "vue";
import { HoverCard } from "frappe-ui";
import { BAR_CARD_DELAY_MS, CARD_LEAVE_DELAY_MS } from "./constants";
import GanttAllocationCard from "./GanttAllocationCard.vue";
import GanttBar from "./GanttBar.vue";
import GanttTimeoffBar from "./GanttTimeoffBar.vue";
import { overlapping, type EmployeeRow, type SummaryBar } from "./rows";
import { capacityStatus, timeoffLabel } from "./summary";
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
const entries = computed(() =>
  overlapping(
    props.row.projects.flatMap((project) => project.allocations),
    props.bar.startDate,
    props.bar.endDate,
  ).map((bar) => ({ bar, employeeName: props.row.name })),
);
const dayOff = computed(() =>
  props.bar.type === "timeoff"
    ? {
        label:
          props.bar.label ??
          timeoffLabel(
            props.bar.startDate,
            props.bar.endDate,
            props.bar.timeoff,
          ),
        holiday: props.bar.label !== undefined,
      }
    : undefined,
);

function add() {
  grid.emit("add", {
    employeeId: props.row.id,
    employeeName: props.row.name,
    startDate: props.bar.startDate,
    endDate: props.bar.endDate,
  });
}
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
    v-else-if="bar.type === 'timeoff' && !bar.hours"
    :start-date="bar.startDate"
    :end-date="bar.endDate"
    :timeoff="bar.timeoff"
    :holiday="bar.label"
    :left="left"
    :width="bar.width"
  />
  <HoverCard
    v-else
    side="bottom"
    align="start"
    :offset="4"
    :hover-delay="BAR_CARD_DELAY_MS"
    :leave-delay="CARD_LEAVE_DELAY_MS"
  >
    <template #trigger>
      <GanttTimeoffBar
        v-if="dayOff"
        role="button"
        tabindex="0"
        :start-date="bar.startDate"
        :end-date="bar.endDate"
        :timeoff="bar.timeoff"
        :holiday="bar.label"
        :left="left"
        :width="bar.width"
        :tooltip="false"
      />
      <GanttBar
        v-else
        role="button"
        tabindex="0"
        :variant="status.variant"
        :label="status.label"
        :left="left"
        :width="bar.width"
        :crosshatch="bar.tentative"
        :billable="bar.billable"
        :ai="bar.isAiCreated"
      />
    </template>
    <GanttAllocationCard
      :entries="entries"
      :day-off="dayOff"
      addable
      @add="add"
    />
  </HoverCard>
</template>
