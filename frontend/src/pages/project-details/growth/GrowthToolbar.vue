<script setup lang="ts">
import { computed } from "vue";
import { Button, Select } from "frappe-ui";
import { SortSelector } from "@/components/SortSelector";
import { GROWTH_SORT_FIELDS } from "./constants";
import { nameFilterOptions } from "./growth";
import OwnerFilter from "./OwnerFilter.vue";
import { useGrowth } from "./useGrowth";

const {
  filters,
  sort,
  hasActiveFilters,
  clearFilters,
  activityOwnerOptions,
  ideationOwnerOptions,
  statuses,
  categories,
} = useGrowth();

const statusOptions = computed(() =>
  nameFilterOptions("All statuses", statuses.value),
);
const categoryOptions = computed(() =>
  nameFilterOptions("All categories", categories.value),
);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex flex-wrap gap-2">
      <OwnerFilter
        v-model="filters.activityOwner"
        placeholder="Activity owner"
        :options="activityOwnerOptions"
      />
      <OwnerFilter
        v-model="filters.ideationOwner"
        placeholder="Ideation owner"
        :options="ideationOwnerOptions"
      />
      <Select
        v-model="filters.status"
        class="w-32 text-ink-gray-7"
        :options="statusOptions"
        placeholder="Status"
        aria-label="Status"
      />
      <Select
        v-model="filters.category"
        class="w-36 text-ink-gray-7"
        :options="categoryOptions"
        placeholder="Category"
        aria-label="Category"
      />
      <Button
        v-if="hasActiveFilters"
        variant="ghost"
        label="Clear"
        @click="clearFilters()"
      />
    </div>
    <SortSelector
      v-model="sort"
      class="text-base text-ink-gray-7"
      :fields="GROWTH_SORT_FIELDS"
    />
  </div>
</template>
