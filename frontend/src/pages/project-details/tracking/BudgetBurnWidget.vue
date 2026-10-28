<script setup lang="ts">
import { computed } from "vue";
import { ProgressBar } from "@/components/ProgressBar";
import { TRACKING_HELP } from "./help";
import LegendItem from "./LegendItem.vue";
import { useTracking } from "./useTracking";
import WidgetCard from "./WidgetCard.vue";

const { tracking, money } = useTracking();

const hasBurn = computed(() => Boolean(tracking.value?.budget_burn));
const actual = computed(() => tracking.value?.budget_burn?.actual ?? 0);
const forecasted = computed(() => tracking.value?.budget_burn?.forecasted ?? 0);
const total = computed(() => tracking.value?.budget_burn?.total_budget ?? 0);
</script>

<template>
  <WidgetCard title="Budget burn (to date)" :help="TRACKING_HELP.budgetBurn">
    <ProgressBar
      label="Budget burn"
      :value="actual"
      :secondary-value="actual + forecasted"
      :max-value="total"
      indicator-class="bg-surface-green-7"
      secondary-indicator-class="bg-surface-green-3"
    />
    <div class="flex flex-col gap-2 text-base leading-tighter text-ink-gray-7">
      <LegendItem
        swatch-class="bg-surface-green-7"
        label="Actual budget burn"
        :value="hasBurn ? money(actual) : 'N/A'"
      />
      <LegendItem
        swatch-class="bg-surface-green-3"
        label="Forecasted budget burn"
        :value="hasBurn ? money(forecasted) : 'N/A'"
      />
      <LegendItem
        swatch-class="bg-surface-gray-3"
        label="Total project budget"
        :value="hasBurn ? money(total) : 'N/A'"
      />
    </div>
  </WidgetCard>
</template>
