<script setup lang="ts">
import { computed } from "vue";
import { ProgressBar } from "@/components/ProgressBar";
import { formatHours } from "@/utils/format";
import { TRACKING_HELP } from "./help";
import LegendItem from "./LegendItem.vue";
import WidgetCard from "./WidgetCard.vue";
import { useTracking } from "./useTracking";

const { tracking } = useTracking();

const billable = computed(() => tracking.value?.hours_utilised_billable ?? 0);
const nonBillable = computed(
  () => tracking.value?.hours_utilised_non_billable ?? 0,
);
const utilised = computed(() => tracking.value?.hours_utilised ?? 0);
const remaining = computed(() => tracking.value?.hours_remaining ?? 0);
</script>

<template>
  <WidgetCard title="Hours usage" :help="TRACKING_HELP.hoursUsage">
    <ProgressBar
      label="Hours usage"
      :value="billable"
      :secondary-value="billable + nonBillable"
      :max-value="utilised + remaining"
      size="md"
      indicator-class="bg-surface-blue-7"
      secondary-indicator-class="bg-surface-blue-2"
    />
    <div class="flex flex-col gap-2 text-base leading-tighter">
      <LegendItem
        swatch-class="bg-surface-blue-7"
        label="Billable hours utilised"
        :value="formatHours(billable, ' h')"
        value-class="text-ink-gray-6"
      />
      <LegendItem
        swatch-class="bg-surface-blue-2"
        label="Non-billable hours utilised"
        :value="formatHours(nonBillable, ' h')"
        value-class="text-ink-gray-6"
      />
      <LegendItem
        swatch-class="bg-surface-gray-8"
        label="Total hours utilised"
        :value="formatHours(utilised, ' h')"
        value-class="text-ink-gray-6"
      />
      <LegendItem
        swatch-class="bg-surface-gray-3"
        label="Total hours remaining"
        :value="formatHours(remaining, ' h')"
        value-class="text-ink-gray-6"
      />
    </div>
  </WidgetCard>
</template>
