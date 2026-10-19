<script setup lang="ts">
import { computed } from "vue";
import { ProgressBar } from "@/components/ProgressBar";
import LegendItem from "./LegendItem.vue";
import { useTracking } from "./useTracking";
import WidgetCard from "./WidgetCard.vue";

const { tracking, money } = useTracking();

const actual = computed(() => tracking.value?.budget_burn?.actual ?? 0);
const forecasted = computed(() => tracking.value?.budget_burn?.forecasted ?? 0);
const total = computed(() => tracking.value?.budget_burn?.total_budget ?? 0);
</script>

<template>
  <WidgetCard title="Budget burn (to date)">
    <ProgressBar
      label="Budget burn"
      :value="actual"
      :secondary-value="actual + forecasted"
      :max-value="total"
      indicator-class="bg-surface-green-7"
      secondary-indicator-class="bg-surface-green-3"
    />
    <div class="flex flex-col gap-2 text-base text-ink-gray-7">
      <LegendItem
        swatch-class="bg-surface-green-7"
        label="Actual budget burn"
        :value="money(actual)"
      />
      <LegendItem
        swatch-class="bg-surface-green-3"
        label="Forecasted budget burn"
        :value="money(forecasted)"
      />
      <LegendItem
        swatch-class="bg-surface-gray-3"
        label="Total project budget"
        :value="money(total)"
      />
    </div>
  </WidgetCard>
</template>
