<script setup lang="ts">
import { computed } from "vue";
import { Skeleton } from "frappe-ui";
import { MonthPicker } from "@/components/MonthPicker";
import { formatCurrency, formatPercentage } from "@/utils/format";
import { KPI_LABELS, type KpiKey, type KpiMetric } from "./kpi";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  kpiKey: KpiKey;
  metric?: KpiMetric;
  loading?: boolean;
}>();

const month = defineModel<string>("month", { required: true });

const display = computed(() => {
  if (!props.metric) return "—";
  return props.kpiKey === "profit_margin"
    ? formatPercentage(props.metric.current)
    : formatCurrency(props.metric.current, "USD");
});
</script>

<template>
  <div class="flex w-full items-center justify-between gap-2">
    <span class="truncate text-base text-ink-gray-5">
      {{ KPI_LABELS[kpiKey] }}
    </span>
    <div class="shrink-0">
      <MonthPicker
        v-model="month"
        variant="ghost"
        icon="lucide-chevron-down"
        align="end"
        class="text-ink-gray-5"
        :aria-label="`${KPI_LABELS[kpiKey]} month, ${month}`"
      />
    </div>
  </div>
  <Skeleton v-if="loading" class="h-8 w-32" />
  <span v-else class="truncate text-2xl-medium text-ink-gray-8">
    {{ display }}
  </span>
</template>
