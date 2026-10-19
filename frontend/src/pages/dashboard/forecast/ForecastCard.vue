<script setup lang="ts">
import { computed } from "vue";
import { Skeleton } from "frappe-ui";
import { useSavedState } from "@/composables/useSavedState";
import { FORECAST_ROLES_KEY } from "@/pages/dashboard/constants";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import {
  filterBySelected,
  roleOptions as toRoleOptions,
} from "@/pages/dashboard/roles";
import WidgetFilter from "@/pages/dashboard/WidgetFilter.vue";
import { forecastSegments, type ForecastRole } from "./forecast";

defineOptions({ inheritAttrs: false });

const forecast = useDashboardCall<{ roles: ForecastRole[] }>(
  "get_forecast_breakdown",
  () => ({ days: 30 }),
);
const selectedRoles = useSavedState<string[]>(FORECAST_ROLES_KEY, []);

const roles = computed(() => forecast.data?.roles ?? []);
const roleOptions = computed(() => toRoleOptions(roles.value));
const segments = computed(() =>
  forecastSegments(filterBySelected(roles.value, selectedRoles.value)),
);
</script>

<template>
  <template v-if="forecast.loading || !forecast.data">
    <div class="flex items-start justify-between gap-4" aria-busy="true">
      <Skeleton class="h-6 w-44" />
      <Skeleton class="h-8 w-44 shrink-0" />
    </div>
    <Skeleton class="h-3 w-full rounded-full" />
    <div class="flex flex-col gap-2">
      <Skeleton v-for="row in 3" :key="row" class="h-5 w-full" />
    </div>
  </template>
  <template v-else>
    <div class="flex items-start justify-between gap-4">
      <h3 class="text-lg-semibold text-ink-gray-8">
        Forecast breakdown for the next month
      </h3>
      <WidgetFilter
        v-model="selectedRoles"
        noun="role"
        :options="roleOptions"
      />
    </div>
    <div
      class="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
      role="img"
      :aria-label="
        segments
          .map((segment) => `${segment.label} ${segment.value}%`)
          .join(', ')
      "
    >
      <div
        v-for="segment in segments"
        :key="segment.key"
        class="h-full"
        :class="segment.colorClass"
        :style="{ width: `${segment.value}%` }"
      />
    </div>
    <ul class="flex flex-col gap-2">
      <li
        v-for="segment in segments"
        :key="segment.key"
        class="flex items-center justify-between gap-4"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="size-2 shrink-0 rounded-full"
            :class="segment.colorClass"
          />
          <span class="truncate text-base text-ink-gray-6">
            {{ segment.label }}
          </span>
        </div>
        <span class="text-base-medium text-ink-gray-7">
          {{ segment.value }}%
        </span>
      </li>
    </ul>
  </template>
</template>
