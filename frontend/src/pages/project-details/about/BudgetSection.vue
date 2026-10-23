<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import { BudgetBurnBar } from "@/components/BudgetBurnBar";
import TruncatedText from "@/pages/project-details/TruncatedText.vue";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { formatCurrency } from "@/utils/format";
import { budgetNotSetHint } from "./sidebar";
import { useProjectSidebar } from "./useProjectSidebar";

const { doc } = useProjectDetails();
const { sidebar } = useProjectSidebar();

const burn = computed(
  () =>
    sidebar.value?.burn ?? {
      total_budget: 0,
      cost_accrued: 0,
      cost_forecasted: 0,
      target_cost: 0,
    },
);
const money = (value: number) =>
  formatCurrency(value, doc.value?.custom_currency);
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex items-center justify-between gap-2">
      <TruncatedText
        :text="money(burn.cost_accrued)"
        class="text-base-medium leading-tighter text-ink-gray-7"
      />
      <TruncatedText
        v-if="burn.total_budget > 0"
        :text="money(burn.total_budget)"
        class="text-base leading-tighter text-ink-gray-5"
      />
      <Tooltip v-else :text="budgetNotSetHint(doc?.custom_billing_type)">
        <!-- eslint-disable-next-line vuejs-accessibility/no-noninteractive-tabindex -- focusable so the hint shows on keyboard focus -->
        <span
          tabindex="0"
          class="truncate text-base leading-tighter text-ink-gray-5"
        >
          Budget not set
        </span>
      </Tooltip>
    </div>
    <BudgetBurnBar
      :value="burn.cost_accrued"
      primary-tooltip="Cost Accrued"
      :secondary-value="burn.cost_forecasted"
      secondary-tooltip="Cost Forecasted"
      :marker-value="burn.target_cost"
      marker-tooltip="Target Cost"
      :max-value="burn.total_budget"
      label="Budget burn"
    />
  </div>
</template>
