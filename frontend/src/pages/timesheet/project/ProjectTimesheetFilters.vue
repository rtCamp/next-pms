<script setup lang="ts">
import { computed } from "vue";
import { TextInput } from "frappe-ui";
import { Filter, FilterLinkValue } from "@/components/Filter";
import { PROJECT_TIMESHEET_FILTER_FIELDS } from "@/pages/timesheet/constants";
import { useProjectTimesheet } from "./useProjectTimesheet";

const timesheet = useProjectTimesheet();

const search = computed({
  get: () => timesheet.filters.search,
  set: (value: string | number) => timesheet.setSearch(String(value)),
});

const compositeFilters = computed({
  get: () => timesheet.filters.compositeFilters,
  set: timesheet.setCompositeFilters,
});
</script>

<template>
  <div class="mb-3.5 flex flex-wrap justify-between gap-2">
    <TextInput
      v-model="search"
      class="w-68 shrink-0"
      placeholder="Search project"
      aria-label="Search project"
      :debounce="400"
    />
    <Filter
      v-model="compositeFilters"
      :fields="PROJECT_TIMESHEET_FILTER_FIELDS"
      align="end"
      :external-filter-count="timesheet.filters.search !== '' ? 1 : 0"
      @clear-all="timesheet.resetFilters()"
    >
      <template #link-value="slotProps">
        <FilterLinkValue v-bind="slotProps" />
      </template>
    </Filter>
  </div>
</template>
