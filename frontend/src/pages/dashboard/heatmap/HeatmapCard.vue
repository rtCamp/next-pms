<script setup lang="ts">
import { computed, watch } from "vue";
import { Skeleton } from "frappe-ui";
import { cva } from "class-variance-authority";
import { useSavedState } from "@/composables/useSavedState";
import { HEATMAP_ROLES_KEY } from "@/pages/dashboard/constants";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import {
  filterBySelected,
  roleOptions as toRoleOptions,
} from "@/pages/dashboard/roles";
import WidgetFilter from "@/pages/dashboard/WidgetFilter.vue";
import {
  HEATMAP_LEGEND,
  cellState,
  defaultRoles,
  heatmapRange,
  monthGroups,
  type AllocationHeatmap,
} from "./heatmap";

defineOptions({ inheritAttrs: false });

const range = heatmapRange(new Date());
const heatmap = useDashboardCall<AllocationHeatmap>(
  "get_allocation_heatmap",
  () => range,
);
const selectedRoles = useSavedState<string[]>(HEATMAP_ROLES_KEY, []);

// Like React, the defaults are applied once, and only over an empty saved filter.
const stopDefaults = watch(
  () => heatmap.data,
  (data) => {
    if (!data) return;
    stopDefaults();
    if (selectedRoles.value.length) return;
    const defaults = defaultRoles(data.roles);
    if (defaults.length) selectedRoles.value = defaults;
  },
);

const roleOptions = computed(() => toRoleOptions(heatmap.data?.roles ?? []));
const visibleRoles = computed(() =>
  filterBySelected(heatmap.data?.roles ?? [], selectedRoles.value),
);
const months = computed(() => monthGroups(heatmap.data?.weeks ?? []));

const stateClass = cva("", {
  variants: {
    state: {
      full: "bg-surface-gray-3",
      partial: "bg-surface-red-4",
      none: "bg-surface-red-6",
    },
  },
});
</script>

<template>
  <template v-if="heatmap.loading || !heatmap.data">
    <Skeleton class="h-6 w-24" />
    <div class="flex flex-col gap-2" aria-busy="true">
      <Skeleton v-for="row in 7" :key="row" class="h-6 w-full" />
    </div>
    <div class="flex justify-center gap-8">
      <Skeleton v-for="item in 3" :key="item" class="h-4 w-28" />
    </div>
  </template>
  <template v-else>
    <div class="flex shrink-0 items-start justify-between gap-4">
      <h3 class="text-lg-semibold text-ink-gray-8">Heatmap</h3>
      <WidgetFilter
        v-model="selectedRoles"
        noun="role"
        :options="roleOptions"
      />
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto">
      <p
        v-if="!visibleRoles.length"
        class="py-8 text-center text-sm text-ink-gray-5"
      >
        No allocation data for this period.
      </p>
      <table
        v-else
        class="w-full table-fixed border-separate border-spacing-x-0.5 border-spacing-y-0"
      >
        <colgroup>
          <col class="w-40" />
          <col v-for="week in heatmap.data.weeks" :key="week.week_start" />
        </colgroup>
        <thead>
          <tr class="h-6">
            <td />
            <th
              v-for="(group, index) in months"
              :key="index"
              scope="colgroup"
              :colspan="group.span"
              class="p-0 text-left align-middle text-2xs font-normal text-ink-gray-5"
            >
              {{ group.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in visibleRoles" :key="role.designation" class="h-6">
            <th
              scope="row"
              :title="role.designation"
              class="truncate p-0 pr-2 text-left align-middle text-2xs font-normal text-ink-gray-5"
            >
              {{ role.designation }}
            </th>
            <td
              v-for="week in role.weeks"
              :key="week.week_start"
              class="p-0 align-middle"
            >
              <span
                role="img"
                class="block h-2 w-full rounded-1"
                :class="stateClass({ state: cellState(week) })"
                :aria-label="`${role.designation} week of ${week.week_start}: ${cellState(week)}`"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <ul class="mt-1 flex shrink-0 justify-center gap-8">
      <li
        v-for="item in HEATMAP_LEGEND"
        :key="item.state"
        class="flex items-center gap-1.5"
      >
        <span
          class="size-2 shrink-0 rounded-full"
          :class="stateClass({ state: item.state })"
        />
        <span class="text-sm text-ink-gray-6">{{ item.label }}</span>
      </li>
    </ul>
  </template>
</template>
