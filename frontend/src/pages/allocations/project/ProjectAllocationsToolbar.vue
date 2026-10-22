<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { Button, MultiSelect, Select, TextInput } from "frappe-ui";
import {
  Filter,
  FilterLinkValue,
  type FilterCondition,
} from "@/components/Filter";
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
  PROJECT_ALLOCATION_TYPE_OPTIONS,
} from "@/pages/allocations/shared/filterParams";
import { ROLE_ACCESS, useSession } from "@/session";
import { PROJECT_FILTER_FIELDS } from "./constants";
import { useProjectAllocations } from "./useProjectAllocations";

const project = useProjectAllocations();
const unsaved = useUnsavedChanges();
const session = useSession();
const query = project.query;

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

const duration = computed({
  get: () => query.duration,
  set: (value: string | number) =>
    guard(() => query.setDuration(parseDuration(String(value)))),
});

const allocationTypeOpen = shallowRef(false);
function setAllocationTypeOpen(open: boolean) {
  guard(() => (allocationTypeOpen.value = open));
}
const allocationTypes = computed({
  get: () => query.allocationTypes,
  set: (values: (string | number)[]) =>
    guard(() =>
      query.setAllocationTypes(
        parseAllocationTypes(values, PROJECT_ALLOCATION_TYPE_OPTIONS),
      ),
    ),
});

const compositeFilters = computed({
  get: () => query.compositeFilters,
  set: (conditions: FilterCondition[]) =>
    guard(() => query.setCompositeFilters(conditions)),
});

// Search, duration and allocation type sit outside the Filter panel but count towards
// its "Clear all", as in the React page.
const externalFilterCount = computed(
  () =>
    Number(query.search !== "") +
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
        placeholder="Search project"
        aria-label="Search project"
        @update:model-value="onSearchInput"
      />
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
        :options="PROJECT_ALLOCATION_TYPE_OPTIONS"
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
        :fields="PROJECT_FILTER_FIELDS"
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
