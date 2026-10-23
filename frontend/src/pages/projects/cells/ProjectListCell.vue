<script setup lang="ts">
import { computed } from "vue";
import { BudgetBurnBar } from "@/components/BudgetBurnBar";
import { formatCurrency, formatPercentage } from "@/utils/format";
import type { ProjectListColumn, ProjectListItem } from "../types";
import DateCell from "./DateCell.vue";
import PersonCell from "./PersonCell.vue";
import PhaseCell from "./PhaseCell.vue";
import ProjectNameCell from "./ProjectNameCell.vue";

const props = defineProps<{
  project: ProjectListItem;
  column: ProjectListColumn;
}>();

const AMOUNT_KEYS = [
  "burn_rate_per_week",
  "total_budget",
  "lifetime_value_to_date",
] as const;
const TEXT_KEYS = ["project_type", "customer", "client_poc_name"] as const;
const DATE_KEYS = [
  "start_date",
  "next_milestone",
  "end_date",
  "contract_end_date",
] as const;

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const text = computed(() => {
  const { project, column } = props;
  const key = column.key;
  if ((AMOUNT_KEYS as readonly string[]).includes(key)) {
    const value = project[key as (typeof AMOUNT_KEYS)[number]];
    return isNumber(value) ? formatCurrency(value, project.currency) : "N/A";
  }
  if (key === "profit_margin") {
    return isNumber(project.profit_margin)
      ? formatPercentage(project.profit_margin)
      : "N/A";
  }
  if ((TEXT_KEYS as readonly string[]).includes(key)) {
    return project[key as (typeof TEXT_KEYS)[number]] || "N/A";
  }
  return null;
});

const costBurn = computed(() => {
  const { cost_accrued, cost_forecasted, target_cost, total_budget } =
    props.project.cost_burn;
  const percent = (value: number) =>
    total_budget > 0 ? (value / total_budget) * 100 : 0;
  return {
    value: percent(cost_accrued),
    secondaryValue: percent(cost_forecasted),
    markerValue: percent(target_cost),
  };
});
</script>

<template>
  <ProjectNameCell
    v-if="column.key === 'name'"
    :project-id="project.name"
    :name="project.project_name"
    :rag-status="project.rag_status"
  />
  <PhaseCell v-else-if="column.key === 'phase'" :phase="project.phase" />
  <div v-else-if="column.key === 'cost_burn_percent'" class="w-full pr-2">
    <BudgetBurnBar v-bind="costBurn" size="sm" />
  </div>
  <DateCell
    v-else-if="(DATE_KEYS as readonly string[]).includes(column.key)"
    :date="project[column.key as (typeof DATE_KEYS)[number]]"
  />
  <PersonCell
    v-else-if="column.key === 'project_manager'"
    :person="project.project_manager"
  />
  <PersonCell
    v-else-if="column.key === 'engineering_manager'"
    :person="project.engineering_manager"
  />
  <span
    v-else-if="text !== null"
    class="block truncate text-base text-ink-gray-6"
  >
    {{ text }}
  </span>
</template>
