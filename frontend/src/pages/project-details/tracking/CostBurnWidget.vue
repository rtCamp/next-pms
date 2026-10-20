<script setup lang="ts">
import { computed } from "vue";
import { ProgressBar } from "@/components/ProgressBar";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import LegendItem from "./LegendItem.vue";
import { useTracking } from "./useTracking";
import WidgetCard from "./WidgetCard.vue";

const { projectId } = useProjectDetails();
const { tracking, money } = useTracking();

const incurred = computed(() => tracking.value?.actual_cost_incurred ?? 0);
const forecasted = computed(
  () => tracking.value?.forecasted_cost_to_completion ?? 0,
);
const total = computed(() => tracking.value?.expected_total_cost ?? 0);
</script>

<template>
  <WidgetCard
    title="Cost burn (to date)"
    :link="{
      label: 'All Timesheets',
      href: `/desk/timesheet?parent_project=${projectId}`,
    }"
  >
    <ProgressBar
      label="Cost burn"
      :value="incurred"
      :secondary-value="incurred + forecasted"
      :max-value="total"
      indicator-class="bg-surface-green-7"
      secondary-indicator-class="bg-surface-green-3"
    />
    <div class="flex flex-col gap-2 text-base leading-tighter text-ink-gray-7">
      <LegendItem
        swatch-class="bg-surface-green-7"
        label="Actual cost incurred"
        :value="money(incurred)"
      />
      <LegendItem
        swatch-class="bg-surface-green-3"
        label="Forecasted cost to completion"
        :value="money(forecasted)"
      />
      <LegendItem
        swatch-class="bg-surface-gray-3"
        label="Target cost"
        :value="money(total)"
      />
    </div>
  </WidgetCard>
</template>
