<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Combobox, MultiSelect, Select, TextInput } from "frappe-ui";
import { ColumnSelector } from "@/components/ColumnSelector";
import { Filter, FilterLinkValue, type FilterField } from "@/components/Filter";
import { SortSelector } from "@/components/SortSelector";
import { useProjectPhases } from "@/composables/useProjectPhases";
import { useSession } from "@/session";
import {
  BILLING_TYPE_OPTIONS,
  CURRENCY_REQUIRED_TOOLTIP,
  MAX_PINNED_COLUMNS,
  MONETARY_SORT_FIELDS,
  PIN_LIMIT_TOOLTIP,
  PROJECT_SORT_FIELDS,
  PROJECT_STATUS_OPTIONS,
  RAG_OPTIONS,
} from "./constants";
import type { ProjectStatus, RagStatus } from "./types";
import {
  AVAILABLE_PROJECT_COLUMNS,
  useProjectColumns,
} from "./useProjectColumns";
import { useProjectFilters } from "./useProjectFilters";

const props = defineProps<{
  /** The kanban has no columns or sort, so their controls are left out. */
  kanban?: boolean;
}>();

const EQUALITY_OPERATORS = [
  { label: "Equals", value: "=" },
  { label: "Not Equals", value: "!=" },
];

const EMPLOYEE_LIST_METHOD =
  "next_pms.timesheet.api.employee.get_employee_list";

function linkField(
  name: string,
  label: string,
  link: FilterField["link"],
): FilterField {
  return { name, label, type: "link", link, operators: EQUALITY_OPERATORS };
}

function employeeField(
  name: string,
  label: string,
  args?: Record<string, unknown>,
): FilterField {
  return linkField(name, label, {
    doctype: "Employee",
    labelField: "employee_name",
    valueField: "user_id",
    customMethod: { method: EMPLOYEE_LIST_METHOD, args },
  });
}

const FILTER_FIELDS: FilterField[] = [
  linkField("name", "Project", {
    doctype: "Project",
    labelField: "project_name",
  }),
  employeeField("custom_project_manager", "Project Manager", {
    roles: ["Projects Manager"],
  }),
  linkField("custom_business_unit", "Business Unit", {
    doctype: "Business Unit",
  }),
  linkField("project_type", "Project Type", { doctype: "Project Type" }),
  {
    name: "custom_billing_type",
    label: "Billing type",
    type: "select",
    options: BILLING_TYPE_OPTIONS,
    operators: EQUALITY_OPERATORS,
  },
  linkField("custom_industry", "Industry", { doctype: "Industry Type" }),
  linkField("customer", "Customer", {
    doctype: "Customer",
    labelField: "customer_name",
  }),
  employeeField("custom_engineering_manager", "Engineering Manager"),
  employeeField("custom_account_manager_", "Account Manager"),
  linkField("custom_host", "Host", { doctype: "Host" }),
  linkField("tag", "Tags", { doctype: "Tag" }),
];

const {
  filters,
  sort,
  setSearch,
  setRagStatus,
  setPhase,
  setStatus,
  setCurrency,
  setAdvanced,
  setSort,
  resetFilters,
} = useProjectFilters();
const {
  selectedColumns,
  isDefault: isDefaultLayout,
  reset: resetColumns,
} = useProjectColumns();
const session = useSession();
const projectPhases = useProjectPhases();

// Debounced here rather than with TextInput's `debounce`, which re-emits the typed
// text on blur and would undo a revert that cleared it in the meantime.
const SEARCH_DEBOUNCE_MS = 400;
const search = ref(filters.value.search);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => filters.value.search,
  (value) => {
    clearTimeout(searchTimer);
    search.value = value;
  },
);
function onSearchInput(value: string | number) {
  search.value = String(value);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (search.value !== filters.value.search) setSearch(search.value);
  }, SEARCH_DEBOUNCE_MS);
}
onBeforeUnmount(() => clearTimeout(searchTimer));

const ragStatus = computed({
  get: () => filters.value.ragStatus,
  set: (value: (string | number)[]) => setRagStatus(value as RagStatus[]),
});

const currencyOptions = computed(() =>
  session.currencies.map((currency) => ({ label: currency, value: currency })),
);
const currency = computed({
  get: () => filters.value.currency || null,
  set: (value: string | number | null | undefined) =>
    setCurrency(value ? String(value) : ""),
});

const phaseOptions = computed(() => [
  ...projectPhases.phases.map(({ phase }) => ({ label: phase, value: phase })),
  { label: "All", value: "" },
]);
// No phase shows the placeholder rather than "All", as the React select did.
const phase = computed({
  get: () => filters.value.phase || null,
  set: (value: string | number | null) => setPhase(value ? String(value) : ""),
});

const status = computed({
  get: () => filters.value.status || null,
  set: (value: string | number | null) =>
    setStatus((value ? String(value) : "") as ProjectStatus | ""),
});

const advanced = computed({
  get: () => filters.value.advanced,
  set: setAdvanced,
});

const sortFields = computed(() =>
  PROJECT_SORT_FIELDS.map((field) => {
    const disabled =
      !filters.value.currency && MONETARY_SORT_FIELDS.includes(field.field);
    return {
      ...field,
      disabled,
      tooltipText: disabled ? CURRENCY_REQUIRED_TOOLTIP : undefined,
    };
  }),
);
const sortModel = computed({
  get: () => (sort.value.field ? sort.value : null),
  set: setSort,
});

// Search, RAG status, phase and status live outside the Filter panel but count
// towards its "Clear all", as in the React page.
const externalFilterCount = computed(
  () =>
    Number(filters.value.search !== "") +
    Number(filters.value.ragStatus.length > 0) +
    Number(filters.value.phase !== "") +
    Number(filters.value.status !== ""),
);
</script>

<template>
  <div class="flex flex-wrap justify-between gap-2 px-5 py-3.5">
    <div class="flex gap-2">
      <TextInput
        :model-value="search"
        class="w-44 shrink-0"
        size="sm"
        placeholder="Search project"
        aria-label="Search project"
        @update:model-value="onSearchInput"
      />
      <MultiSelect
        v-model="ragStatus"
        class="w-44 shrink-0"
        :options="RAG_OPTIONS"
        placeholder="RAG Status"
        aria-label="RAG Status"
      />
      <Combobox
        v-model="currency"
        class="w-28 shrink-0"
        :options="currencyOptions"
        placeholder="Currency"
        aria-label="Currency"
      >
        <template v-if="currency" #suffix="{ clear }">
          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center rounded-1 text-ink-gray-6 outline-none hover:text-ink-gray-8 focus-visible:ring focus-visible:ring-outline-gray-3"
            aria-label="Clear currency"
            @pointerdown.stop
            @click.stop="clear()"
          >
            <span class="lucide-x size-4" aria-hidden="true" />
          </button>
        </template>
      </Combobox>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- aria-label reaches frappe-ui's trigger -->
      <Select
        v-model="phase"
        :options="phaseOptions"
        placeholder="Phases"
        aria-label="Phases"
      />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- aria-label reaches frappe-ui's trigger -->
      <Select
        v-model="status"
        :options="PROJECT_STATUS_OPTIONS"
        placeholder="Status"
        aria-label="Status"
      />
    </div>
    <div class="flex gap-2">
      <slot name="actions" />
      <ColumnSelector
        v-if="!props.kanban"
        v-model="selectedColumns"
        :available-columns="AVAILABLE_PROJECT_COLUMNS"
        pinnable
        :max-pinned="MAX_PINNED_COLUMNS"
        :labels="{ pinLimit: PIN_LIMIT_TOOLTIP }"
        :resettable="!isDefaultLayout"
        @reset="resetColumns"
      />
      <SortSelector
        v-if="!props.kanban"
        v-model="sortModel"
        :fields="sortFields"
      />
      <Filter
        v-model="advanced"
        :fields="FILTER_FIELDS"
        align="end"
        :external-filter-count="externalFilterCount"
        @clear-all="resetFilters"
      >
        <template #link-value="slotProps">
          <FilterLinkValue :key="slotProps.field.name" v-bind="slotProps" />
        </template>
      </Filter>
    </div>
  </div>
</template>
