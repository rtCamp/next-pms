<script setup lang="ts">
import { computed } from "vue";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { cn } from "@/utils/cn";
import FinancialsBlock from "./FinancialsBlock.vue";
import KnowledgePoint from "./KnowledgePoint.vue";
import type { WidgetLayout } from "./types";
import { useTracking } from "./useTracking";

const props = defineProps<{ layout: WidgetLayout }>();

const { projectId } = useProjectDetails();
const { tracking, money } = useTracking();

const salesOrderHref = computed(
  () =>
    `/desk/sales-order?status=${encodeURIComponent(
      JSON.stringify(["!=", "Cancelled"]),
    )}&project=${encodeURIComponent(projectId.value)}`,
);
const totalProjectValue = computed(() => {
  const value = tracking.value?.total_project_value;
  return value == null ? "N/A" : money(value);
});
const isRow = computed(() => props.layout === "row");
</script>

<template>
  <FinancialsBlock
    v-if="tracking?.billing_type === 'Time and Material'"
    show-project-value
    :layout="layout"
  />
  <div
    v-else
    :class="
      cn(
        'flex min-w-0 flex-1 flex-col justify-between gap-3',
        isRow && 'lg:flex-row',
      )
    "
  >
    <div :class="cn('flex shrink-0', isRow && 'lg:flex-1')">
      <KnowledgePoint
        title="Total project value"
        :value="totalProjectValue"
        :href="salesOrderHref"
      />
    </div>
    <div :class="cn('flex flex-1', isRow && 'lg:flex-[2]')">
      <FinancialsBlock :show-project-value="false" :layout="layout" />
    </div>
  </div>
</template>
