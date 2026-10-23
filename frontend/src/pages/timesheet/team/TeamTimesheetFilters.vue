<script setup lang="ts">
import { computed } from "vue";
import { TextInput } from "frappe-ui";
import { Filter, FilterLinkValue } from "@/components/Filter";
import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import ApprovalStatusFilter from "@/pages/timesheet/ApprovalStatusFilter.vue";
import { TEAM_TIMESHEET_FILTER_FIELDS } from "@/pages/timesheet/constants";
import ReportsToFilter from "./ReportsToFilter.vue";
import { useTeamTimesheet } from "./useTeamTimesheet";

const timesheet = useTeamTimesheet();

const search = computed({
  get: () => timesheet.filters.search,
  set: (value: string | number) => timesheet.setSearch(String(value)),
});

const reportsTo = computed({
  get: () => timesheet.filters.reportsTo ?? null,
  set: (value: string | null) => timesheet.setReportsTo(value),
});

const approvalStatus = computed({
  get: () => timesheet.filters.approvalStatus ?? [],
  set: (value: ApprovalStatusValue[]) => timesheet.setApprovalStatus(value),
});

const compositeFilters = computed({
  get: () => timesheet.filters.compositeFilters,
  set: timesheet.setCompositeFilters,
});

// Search, reports-to and approval status sit outside the Filter panel but count
// towards its "Clear all", as in the React page.
const externalFilterCount = computed(
  () =>
    Number(timesheet.filters.search !== "") +
    Number(approvalStatus.value.length > 0) +
    Number(Boolean(timesheet.filters.reportsTo)),
);
</script>

<template>
  <div class="mb-3.5 flex flex-wrap justify-between gap-2">
    <div class="flex gap-2">
      <TextInput
        v-model="search"
        class="w-68 shrink-0"
        placeholder="Search members"
        aria-label="Search members"
        :debounce="400"
      />
      <ReportsToFilter v-model="reportsTo" />
      <ApprovalStatusFilter v-model="approvalStatus" />
    </div>
    <Filter
      v-model="compositeFilters"
      :fields="TEAM_TIMESHEET_FILTER_FIELDS"
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
