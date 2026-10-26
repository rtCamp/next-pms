<script setup lang="ts">
import { Select } from "frappe-ui";
import { Filter, FilterLinkValue, type FilterField } from "@/components/Filter";
import { SortSelector } from "@/components/SortSelector";
import {
  EMPLOYEE_LIST_METHOD,
  RISK_LEVELS,
  RISK_SORT_FIELDS,
  RISK_STATUSES,
} from "./constants";
import { useRisks } from "./useRisks";

const {
  quick,
  advanced,
  sort,
  activeQuickFilters,
  clearQuickFilters,
  riskOwnerOptions,
  ownerOptions,
} = useRisks();

const EQUALITY_OPERATORS = [
  { label: "Equals", value: "=" },
  { label: "Not Equals", value: "!=" },
];

function userField(name: string, label: string): FilterField {
  return {
    name,
    label,
    type: "link",
    link: {
      doctype: "Employee",
      labelField: "employee_name",
      valueField: "user_id",
      customMethod: { method: EMPLOYEE_LIST_METHOD },
    },
    operators: EQUALITY_OPERATORS,
  };
}

const FILTER_FIELDS: FilterField[] = [
  { name: "risk_category", label: "Risk category", type: "string" },
  { name: "summary", label: "Summary", type: "string" },
  userField("risk_owner", "Risk owner"),
  userField("owner", "Owner"),
];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  ...RISK_STATUSES.map((status) => ({ label: status, value: status })),
];
const LEVEL_OPTIONS = [
  { label: "All", value: "" },
  ...RISK_LEVELS.map((level) => ({ label: level, value: level })),
];
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex flex-wrap gap-2">
      <Select
        v-model="quick.riskOwner"
        class="w-36 text-ink-gray-7"
        :options="riskOwnerOptions"
        placeholder="Risk owner"
        aria-label="Risk owner"
      />
      <Select
        v-model="quick.owner"
        class="w-36 text-ink-gray-7"
        :options="ownerOptions"
        placeholder="Owner"
        aria-label="Owner"
      />
      <Select
        v-model="quick.status"
        class="w-30 text-ink-gray-7"
        :options="STATUS_OPTIONS"
        placeholder="Status"
        aria-label="Status"
      />
      <Select
        v-model="quick.riskLevel"
        class="w-30 text-ink-gray-7"
        :options="LEVEL_OPTIONS"
        placeholder="Risk level"
        aria-label="Risk level"
      />
    </div>
    <div class="flex gap-2">
      <Filter
        v-model="advanced"
        :fields="FILTER_FIELDS"
        align="end"
        :external-filter-count="activeQuickFilters"
        @clear-all="clearQuickFilters()"
      >
        <template #link-value="slotProps">
          <FilterLinkValue :key="slotProps.field.name" v-bind="slotProps" />
        </template>
      </Filter>
      <SortSelector
        v-model="sort"
        class="text-base text-ink-gray-7"
        :fields="RISK_SORT_FIELDS"
      />
    </div>
  </div>
</template>
