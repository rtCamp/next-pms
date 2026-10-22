<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { Button, MultiSelect, Select, TextInput } from "frappe-ui";
import {
  Filter,
  FilterLinkValue,
  type FilterCondition,
} from "@/components/Filter";
import { useDepartmentLookup } from "@/composables/useDepartmentLookup";
import { useDesignationLookup } from "@/composables/useDesignationLookup";
import type { LookupOption } from "@/composables/useRemoteLookup";
import { useUnsavedChanges } from "@/composables/useUnsavedChanges";
import {
  DEFAULT_DURATION,
  DURATION_OPTIONS,
  FILTER_DEBOUNCE_MS,
  NAVIGATION_LABELS,
} from "@/pages/allocations/shared/constants";
import { parseDuration } from "@/pages/allocations/shared/dateWindow";
import {
  parseAllocationTypes,
  resolveAllocationTypes,
} from "@/pages/allocations/shared/filterParams";
import { ROLE_ACCESS, useSession } from "@/session";
import {
  BUSINESS_UNIT_FIELD,
  TEAM_ALLOCATION_TYPE_OPTIONS,
  TEAM_FILTER_FIELDS,
} from "./constants";
import { useTeamAllocations } from "./useTeamAllocations";

const team = useTeamAllocations();
const unsaved = useUnsavedChanges();
const session = useSession();
const query = team.query;

const guard = (action: () => void) => unsaved.requestGuardedAction(action);

const showFilters = computed(() =>
  session.hasAnyRole(ROLE_ACCESS.manageAllocations),
);

// The search box keeps what is typed and writes it to the URL once typing pauses.
const searchInput = shallowRef(query.search);
watch(
  () => query.search,
  (search) => (searchInput.value = search),
);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
function onSearchInput(value: string | number) {
  guard(() => {
    searchInput.value = String(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (searchInput.value !== query.search)
        query.setSearch(searchInput.value);
    }, FILTER_DEBOUNCE_MS);
  });
}

/** Lookup options with the selected values kept, so their checks don't disappear. */
function withSelected(options: LookupOption[], selected: string[]) {
  const listed = new Set(options.map((option) => option.value));
  return [
    ...selected
      .filter((value) => !listed.has(value))
      .map((value) => ({ label: value, value })),
    ...options,
  ];
}

const designationQuery = ref("");
const designationLookup = useDesignationLookup({
  enabled: showFilters,
  query: designationQuery,
});
const designationOptions = computed(() =>
  withSelected(designationLookup.options, query.lists.designation),
);
const designation = computed({
  get: () => query.lists.designation,
  set: (values: (string | number)[]) =>
    guard(() => query.setList("designation", values.map(String))),
});

const departmentQuery = ref("");
const departmentLookup = useDepartmentLookup({
  enabled: showFilters,
  query: departmentQuery,
});
const departmentOptions = computed(() =>
  withSelected(departmentLookup.options, query.lists.department),
);
const department = computed({
  get: () => query.lists.department,
  set: (values: (string | number)[]) =>
    guard(() => query.setList("department", values.map(String))),
});

const duration = computed({
  get: () => query.duration,
  set: (value: string | number) =>
    guard(() => query.setDuration(parseDuration(String(value)))),
});

const allocationTypeOpen = shallowRef(false);
function setAllocationTypeOpen(open: boolean) {
  guard(() => (allocationTypeOpen.value = open));
}
// Statuses can't narrow "No allocation" on its own, so they are disabled rather than
// shown as an active filter that does nothing.
const allocationTypeOptions = computed(() => {
  const { isStatusApplicable } = resolveAllocationTypes(query.allocationTypes);
  return TEAM_ALLOCATION_TYPE_OPTIONS.map((option) => ({
    ...option,
    disabled:
      !isStatusApplicable &&
      (option.value === "Confirmed" || option.value === "Tentative"),
  }));
});
const allocationTypes = computed({
  get: () => query.allocationTypes,
  set: (values: (string | number)[]) =>
    guard(() => query.setAllocationTypes(parseAllocationTypes(values))),
});

const filterFields = computed(() =>
  TEAM_FILTER_FIELDS.filter(
    (field) => session.hasBusinessUnit || field.name !== BUSINESS_UNIT_FIELD,
  ),
);
const compositeFilters = computed({
  get: () => query.compositeFilters,
  set: (conditions: FilterCondition[]) =>
    guard(() => query.setCompositeFilters(conditions)),
});

// Search, designation, department, duration and allocation type sit outside the Filter
// panel but count towards its "Clear all", as in the React page.
const externalFilterCount = computed(
  () =>
    Number(query.search !== "") +
    Number(query.lists.designation.length > 0) +
    Number(query.lists.department.length > 0) +
    Number(query.duration !== DEFAULT_DURATION) +
    Number(query.allocationTypes.length > 0),
);

function clearAll() {
  guard(() => {
    clearTimeout(searchTimer);
    searchInput.value = "";
    query.clearAll();
  });
}
</script>

<template>
  <div class="flex w-full flex-wrap justify-between gap-2 px-5">
    <div class="flex flex-wrap gap-2">
      <TextInput
        :model-value="searchInput"
        variant="subtle"
        placeholder="Search members"
        aria-label="Search members"
        @update:model-value="onSearchInput"
      />
      <template v-if="showFilters">
        <MultiSelect
          v-model="designation"
          v-model:query="designationQuery"
          class="w-42"
          :options="designationOptions"
          :loading="designationLookup.loading"
          :filterable="false"
          placeholder="Select designation"
          aria-label="Designation"
        >
          <template #footer="{ clear }">
            <div
              class="flex items-center justify-end gap-2 border-t border-outline-gray-1 px-2 py-1.5"
            >
              <Button
                variant="ghost"
                size="sm"
                label="Clear"
                :disabled="!designation.length && !designationQuery"
                @click="
                  () => {
                    designationQuery = '';
                    clear();
                  }
                "
              />
            </div>
          </template>
        </MultiSelect>
        <MultiSelect
          v-model="department"
          v-model:query="departmentQuery"
          class="w-42"
          :options="departmentOptions"
          :loading="departmentLookup.loading"
          :filterable="false"
          placeholder="Select department"
          aria-label="Department"
        >
          <template #footer="{ clear }">
            <div
              class="flex items-center justify-end gap-2 border-t border-outline-gray-1 px-2 py-1.5"
            >
              <Button
                variant="ghost"
                size="sm"
                label="Clear"
                :disabled="!department.length && !departmentQuery"
                @click="
                  () => {
                    departmentQuery = '';
                    clear();
                  }
                "
              />
            </div>
          </template>
        </MultiSelect>
      </template>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- aria-label reaches frappe-ui's trigger -->
      <Select
        v-model="duration"
        class="w-fit"
        :options="DURATION_OPTIONS"
        placeholder="Duration"
        aria-label="Duration"
      />
      <MultiSelect
        v-if="showFilters"
        v-model="allocationTypes"
        class="w-fit max-w-42"
        :open="allocationTypeOpen"
        :options="allocationTypeOptions"
        hide-search
        placeholder="Allocation type"
        aria-label="Allocation type"
        @update:open="setAllocationTypeOpen"
      >
        <template #footer="{ clear }">
          <div
            class="flex items-center justify-end gap-2 border-t border-outline-gray-1 px-2 py-1.5"
          >
            <Button
              variant="ghost"
              size="sm"
              label="Clear"
              @click="
                () => {
                  clear();
                  allocationTypeOpen = false;
                }
              "
            />
          </div>
        </template>
      </MultiSelect>
    </div>
    <div class="flex gap-2">
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          icon="lucide-chevron-left"
          :label="NAVIGATION_LABELS.previous[query.duration]"
          @click="guard(query.previous)"
        />
        <Button variant="ghost" label="Today" @click="guard(query.today)" />
        <Button
          variant="ghost"
          icon="lucide-chevron-right"
          :label="NAVIGATION_LABELS.next[query.duration]"
          @click="guard(query.next)"
        />
      </div>
      <Filter
        v-if="showFilters"
        v-model="compositeFilters"
        :fields="filterFields"
        align="end"
        :external-filter-count="externalFilterCount"
        @clear-all="clearAll"
      >
        <template #link-value="slotProps">
          <FilterLinkValue :key="slotProps.field.name" v-bind="slotProps" />
        </template>
      </Filter>
    </div>
  </div>
</template>
