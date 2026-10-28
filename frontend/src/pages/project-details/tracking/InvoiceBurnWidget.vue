<script setup lang="ts">
import { computed } from "vue";
import { ProgressBar } from "@/components/ProgressBar";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { TRACKING_HELP } from "./help";
import LegendItem from "./LegendItem.vue";
import { useTracking } from "./useTracking";
import WidgetCard from "./WidgetCard.vue";

const { projectId } = useProjectDetails();
const { tracking, money } = useTracking();

const burn = computed(() => tracking.value?.invoice_burn);
const currency = computed(() => burn.value?.currency);
const paid = computed(() => burn.value?.invoiced_and_paid);
const unpaid = computed(() => burn.value?.invoiced_but_not_paid);
const total = computed(() => burn.value?.total_project_amount ?? null);
</script>

<template>
  <WidgetCard
    title="Invoice burn (to date)"
    :help="TRACKING_HELP.invoiceBurn"
    :link="{
      label: 'All invoices',
      href: `/desk/sales-invoice?project=${projectId}`,
    }"
  >
    <ProgressBar
      label="Invoice burn"
      :value="paid ?? 0"
      :secondary-value="(paid ?? 0) + (unpaid ?? 0)"
      :max-value="total || 0"
      indicator-class="bg-surface-violet-7"
      secondary-indicator-class="bg-surface-blue-7"
    />
    <div class="flex flex-col gap-2 text-base leading-tighter text-ink-gray-7">
      <LegendItem
        swatch-class="bg-surface-violet-7"
        label="Invoiced and paid"
        :value="paid === undefined ? 'N/A' : money(paid, currency)"
      />
      <LegendItem
        swatch-class="bg-surface-blue-7"
        label="Invoiced but not paid"
        :value="unpaid === undefined ? 'N/A' : money(unpaid, currency)"
      />
      <LegendItem
        swatch-class="bg-surface-gray-3"
        label="Total project value"
        label-tooltip="Total Sales Order Value"
        :value="total === null ? 'N/A' : money(total, currency)"
      />
    </div>
  </WidgetCard>
</template>
