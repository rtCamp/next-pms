<script setup lang="ts">
import { computed } from "vue";
import { Skeleton } from "frappe-ui";
import { InfoHoverCard } from "@/components/InfoHoverCard";
import { MonthPicker } from "@/components/MonthPicker";
import { LEADERSHIP_KPI_HELP } from "@/pages/dashboard/help";
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
    <span class="flex min-w-0 items-center gap-1.5">
      <span class="truncate text-base text-ink-gray-5">
        {{ KPI_LABELS[kpiKey] }}
      </span>
      <InfoHoverCard :help="LEADERSHIP_KPI_HELP[kpiKey]" />
    </span>
    <div class="flex shrink-0">
      <MonthPicker v-model="month" align="end">
        <template #trigger="{ label }">
          <button
            type="button"
            class="flex items-center gap-0.5 text-sm text-ink-gray-5"
            :aria-label="`${KPI_LABELS[kpiKey]} month, ${label}`"
          >
            {{ label }}
            <span class="lucide-chevron-down size-4" aria-hidden="true" />
          </button>
        </template>
      </MonthPicker>
    </div>
  </div>
  <Skeleton v-if="loading" class="h-8 w-32" />
  <span v-else class="truncate text-3xl-medium text-ink-gray-8">
    {{ display }}
  </span>
</template>
