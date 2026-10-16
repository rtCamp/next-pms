<script setup lang="ts">
import { computed } from "vue";
import { TextInput } from "frappe-ui";
import { Filter, FilterLinkValue } from "@/components/Filter";
import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import ApprovalStatusFilter from "@/pages/timesheet/ApprovalStatusFilter.vue";
import { PERSONAL_TIMESHEET_FILTER_FIELDS } from "@/pages/timesheet/constants";
import { usePersonalTimesheet } from "./usePersonalTimesheet";

const timesheet = usePersonalTimesheet();

const search = computed({
  get: () => timesheet.filters.search,
  set: (value: string | number) => timesheet.setSearch(String(value)),
});

const approvalStatus = computed({
  get: () => timesheet.filters.approvalStatus ?? [],
  set: (value: ApprovalStatusValue[]) => timesheet.setApprovalStatus(value),
});

const compositeFilters = computed({
  get: () => timesheet.filters.compositeFilters,
  set: timesheet.setCompositeFilters,
});

// Search and approval status sit outside the Filter panel but count towards its
// "Clear all", as in the React page.
const externalFilterCount = computed(
  () =>
    Number(timesheet.filters.search !== "") +
    Number(approvalStatus.value.length > 0),
);
</script>

<template>
  <div class="mb-3.5 flex flex-wrap justify-between gap-2">
    <div class="flex gap-2">
      <TextInput
        v-model="search"
        class="w-68 shrink-0"
        placeholder="Search tasks"
        aria-label="Search tasks"
        :debounce="400"
      />
      <ApprovalStatusFilter v-model="approvalStatus" />
    </div>
    <Filter
      v-model="compositeFilters"
      :fields="PERSONAL_TIMESHEET_FILTER_FIELDS"
      align="end"
      :external-filter-count="externalFilterCount"
      @clear-all="timesheet.resetFilters()"
    >
      <template #link-value="slotProps">
        <FilterLinkValue v-bind="slotProps" />
      </template>
    </Filter>
  </div>
</template>
