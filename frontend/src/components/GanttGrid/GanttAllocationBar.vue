<script setup lang="ts">
import { computed } from "vue";
import { HoverCard } from "frappe-ui";
import { BAR_CARD_DELAY_MS, CARD_LEAVE_DELAY_MS } from "./constants";
import GanttAllocationCard from "./GanttAllocationCard.vue";
import GanttBar from "./GanttBar.vue";
import { overlapping, type AllocationBar, type CardEntry } from "./rows";
import { useGanttGrid } from "./useGanttGrid";

const props = defineProps<{
  bar: AllocationBar;
  /** Every bar in the row; the ones under this bar are listed in its card. */
  rowBars: AllocationBar[];
  employeeName?: string;
  employeeImage?: string;
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

// Overlapping bars share the lane and stack, so the card lists the ones underneath.
const entries = computed<CardEntry[]>(() =>
  [
    props.bar,
    ...overlapping(
      props.rowBars.filter((other) => other !== props.bar),
      props.bar.startDate,
      props.bar.endDate,
    ),
  ].map((bar) => ({
    bar,
    employeeName: props.employeeName,
    employeeImage: props.employeeImage,
  })),
);
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
        :variant="variant"
        :label="label"
        :left="bar.barOffset + grid.headerWidth.value"
        :width="bar.width"
        :crosshatch="bar.isAiCreated || bar.tentative"
        :billable="bar.billable"
        :ai="bar.isAiCreated"
      />
    </template>
    <GanttAllocationCard :entries="entries" />
  </HoverCard>
</template>
