<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Dropdown } from "frappe-ui";
import TruncatedText from "@/pages/project-details/TruncatedText.vue";
import { cn } from "@/utils/cn";
import { formatPercentage } from "@/utils/format";
import type { WidgetLayout } from "./types";
import { useTracking } from "./useTracking";

const props = withDefaults(
  defineProps<{ showProjectValue: boolean; layout?: WidgetLayout }>(),
  { layout: "stacked" },
);

const { tracking, money } = useTracking();
const mode = ref<"projected" | "current">("projected");

const rows = computed(() => {
  const data = tracking.value;
  const projected = mode.value === "projected";
  const projectValue = projected
    ? data?.total_project_value
    : data?.current_project_value;
  const profit = projected ? data?.project_profit : data?.current_profit;
  const margin = projected
    ? data?.projected_profit_margin
    : data?.current_profit_margin;
  const amount = (value: number | null | undefined) =>
    value == null ? "N/A" : money(value);
  return [
    ...(props.showProjectValue
      ? [
          {
            key: "project-value",
            label: "Total project value",
            value: amount(projectValue),
          },
        ]
      : []),
    {
      key: "profit",
      label: projected ? "Projected profit" : "Current profit",
      value: amount(profit),
    },
    {
      key: "margin",
      label: projected ? "Projected profit margin" : "Current profit margin",
      value: margin == null ? "N/A" : formatPercentage(margin),
    },
  ];
});

const modeOptions = computed(() => [
  {
    label: "Current",
    selected: mode.value === "current",
    onClick: () => (mode.value = "current"),
  },
  {
    label: "Projected",
    selected: mode.value === "projected",
    onClick: () => (mode.value = "projected"),
  },
]);

const isRow = computed(() => props.layout === "row");
</script>

<template>
  <div
    class="relative flex min-w-0 flex-1 flex-col rounded-7 border border-outline-gray-1 bg-surface-elevation-1"
  >
    <div class="absolute right-3 top-3">
      <Dropdown :options="modeOptions" align="center">
        <Button
          variant="ghost"
          icon="lucide-ellipsis"
          label="Switch financial figures"
        />
      </Dropdown>
    </div>
    <div
      :class="
        cn(
          'flex flex-1 flex-col px-3',
          isRow && 'lg:flex-row lg:items-center lg:py-3 lg:pl-0 lg:pr-10',
        )
      "
    >
      <template v-for="(row, index) in rows" :key="row.key">
        <div
          v-if="index > 0"
          :class="
            cn(
              'flex w-full shrink-0 justify-center',
              isRow && 'lg:w-auto lg:flex-1 lg:self-stretch',
            )
          "
        >
          <div
            :class="
              cn(
                'w-full border-t border-outline-gray-1',
                isRow && 'lg:h-auto lg:w-0 lg:border-l lg:border-t-0',
              )
            "
          />
        </div>
        <div
          :class="
            cn(
              'flex min-w-0 flex-1 flex-col justify-center gap-2 py-3',
              isRow && 'lg:flex-initial lg:px-3 lg:py-0',
            )
          "
        >
          <span class="truncate pr-6 text-base text-ink-gray-5">
            {{ row.label }}
          </span>
          <TruncatedText
            class="text-2xl-medium text-ink-gray-8"
            :text="row.value"
          />
        </div>
      </template>
    </div>
  </div>
</template>
