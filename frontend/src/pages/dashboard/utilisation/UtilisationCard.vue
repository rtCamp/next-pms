<script setup lang="ts">
import { computed } from "vue";
import { DonutChart } from "frappe-ui/charts";
import { useSavedState } from "@/composables/useSavedState";
import { UTILISATION_ROLES_KEY } from "@/pages/dashboard/constants";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import WidgetFilter from "@/pages/dashboard/WidgetFilter.vue";
import {
  filterBySelected,
  roleOptions as toRoleOptions,
} from "@/pages/dashboard/roles";
import { errorMessage } from "@/utils/errors";
import { formatHours } from "@/utils/format";
import { utilisationSlices, type TimeUtilisationRole } from "./utilisation";

defineOptions({ inheritAttrs: false });

const utilisation = useDashboardCall<{ roles: TimeUtilisationRole[] }>(
  "get_time_utilisation",
  () => ({ days: 30 }),
);
const selectedRoles = useSavedState<string[]>(UTILISATION_ROLES_KEY, []);

const roles = computed(() => utilisation.data?.roles ?? []);
const roleOptions = computed(() => toRoleOptions(roles.value));
const slices = computed(() =>
  utilisationSlices(filterBySelected(roles.value, selectedRoles.value)),
);
</script>

<template>
  <div class="flex items-start justify-between gap-4">
    <h3 class="text-lg-semibold text-ink-gray-8">
      Utilised time in the past 30 days
    </h3>
    <WidgetFilter v-model="selectedRoles" noun="role" :options="roleOptions" />
  </div>
  <div class="h-60">
    <DonutChart
      :data="slices"
      category="category"
      value="hours"
      center-label="Hours"
      :format="(value: number) => formatHours(value)"
      :loading="utilisation.loading"
      :error="utilisation.error ? errorMessage(utilisation.error) : null"
    />
  </div>
</template>
