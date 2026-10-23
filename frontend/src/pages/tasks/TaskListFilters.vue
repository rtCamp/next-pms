<script setup lang="ts">
import { computed, ref } from "vue";
import { Combobox, MultiSelect, TextInput } from "frappe-ui";
import { ColumnSelector } from "@/components/ColumnSelector";
import { Filter, type FilterField } from "@/components/Filter";
import { SortSelector } from "@/components/SortSelector";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_SORTABLE_FIELDS,
  TASK_STATUS_OPTIONS,
} from "./constants";
import type { TaskListStatus } from "./types";
import { AVAILABLE_TASK_COLUMNS, useTaskColumns } from "./useTaskColumns";
import { useTaskFilters } from "./useTaskFilters";

const EQUALITY_OPERATORS = [
  { label: "Equals", value: "=" },
  { label: "Not Equals", value: "!=" },
];

const FILTER_FIELDS: FilterField[] = [
  {
    name: "priority",
    label: "Priority",
    type: "select",
    options: TASK_PRIORITY_OPTIONS,
    operators: EQUALITY_OPERATORS,
  },
  {
    name: "custom_is_billable",
    label: "Is Billable",
    type: "select",
    options: [
      { label: "Yes", value: "1" },
      { label: "No", value: "0" },
    ],
    operators: EQUALITY_OPERATORS,
  },
  { name: "exp_end_date", label: "Due date", type: "daterange" },
];

const SORT_FIELDS = TASK_SORTABLE_FIELDS.map(({ field, label }) => ({
  field,
  label,
}));

const {
  filters,
  sort,
  setSearch,
  setProject,
  setStatus,
  setAdvanced,
  setSort,
  resetFilters,
} = useTaskFilters();
const { selectedColumns, isDefault, reset: resetColumns } = useTaskColumns();

const search = computed({
  get: () => filters.value.search,
  set: (value: string | number) => setSearch(String(value)),
});

const status = computed({
  get: () => filters.value.status,
  set: (value: (string | number)[]) => setStatus(value as TaskListStatus[]),
});

const advanced = computed({
  get: () => filters.value.advanced,
  set: setAdvanced,
});

const sortModel = computed({
  get: () => (sort.value.field ? sort.value : null),
  set: setSort,
});

const selectedProjectLabel = computed(() =>
  filters.value.project
    ? filters.value.projectLabel || filters.value.project
    : "",
);
const projectQuery = ref("");
const projectLookup = useDoctypeLinkLookup({
  doctype: "Project",
  labelField: "project_name",
  // In input mode the combobox puts the selected option's label in the query; that's
  // not a search, so it's left out.
  query: () =>
    projectQuery.value === selectedProjectLabel.value ? "" : projectQuery.value,
  selected: () =>
    filters.value.project
      ? {
          label: filters.value.projectLabel || filters.value.project,
          value: filters.value.project,
        }
      : null,
});
const projectOptions = computed(() => [
  { label: "All", value: "" },
  ...projectLookup.options,
]);

// No project shows the placeholder rather than "All": in input mode the combobox keeps
// the selected label in the field, so typing would append to "All". Picking "All"
// clears the filter.
const project = computed({
  get: () => filters.value.project || null,
  set: (value: string | number | null) => {
    const next = value ? String(value) : "";
    const label = projectOptions.value.find(
      (option) => option.value === next,
    )?.label;
    setProject(next, label);
  },
});

// Search, project and status live outside the Filter panel but count towards its
// "Clear all", as in the React page.
const externalFilterCount = computed(
  () =>
    Number(filters.value.search !== "") +
    Number(filters.value.project !== "") +
    Number(filters.value.status.length > 0),
);
</script>

<template>
  <div class="flex flex-wrap justify-between gap-2 px-5 py-3.5">
    <div class="flex gap-2">
      <TextInput
        v-model="search"
        class="w-44 shrink-0"
        size="sm"
        placeholder="Search task"
        aria-label="Search task"
        :debounce="400"
      />
      <Combobox
        v-model="project"
        v-model:query="projectQuery"
        class="w-44 shrink-0"
        :options="projectOptions"
        :loading="projectLookup.loading"
        :filterable="false"
        placeholder="Project"
        aria-label="Project"
      />
      <MultiSelect
        v-model="status"
        class="w-44 shrink-0"
        :options="TASK_STATUS_OPTIONS"
        placeholder="Status"
        aria-label="Status"
      />
    </div>
    <div class="flex gap-2">
      <ColumnSelector
        v-model="selectedColumns"
        :available-columns="AVAILABLE_TASK_COLUMNS"
        :resettable="!isDefault"
        @reset="resetColumns"
      />
      <SortSelector v-model="sortModel" :fields="SORT_FIELDS" />
      <Filter
        v-model="advanced"
        :fields="FILTER_FIELDS"
        align="end"
        :external-filter-count="externalFilterCount"
        @clear-all="resetFilters"
      />
    </div>
  </div>
</template>
