<script setup lang="ts">
import { computed } from "vue";
import { DonutChart } from "frappe-ui/charts";
import { useSavedState } from "@/composables/useSavedState";
import { UTILISATION_ROLES_KEY } from "@/pages/dashboard/constants";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import WidgetFilter from "@/pages/dashboard/WidgetFilter.vue";
import { formatHours } from "@/utils/format";

defineOptions({ inheritAttrs: false });

interface TimeUtilisationRole {
  designation: string;
  billable_hours: number;
  non_billable_hours: number;
}

const utilisation = useDashboardCall<{ roles: TimeUtilisationRole[] }>(
  "get_time_utilisation",
  () => ({ days: 30 }),
);
const selectedRoles = useSavedState<string[]>(UTILISATION_ROLES_KEY, []);

const roles = computed(() => utilisation.data?.roles ?? []);
const roleOptions = computed(() =>
  roles.value.map((role) => ({
    value: role.designation,
    label: role.designation,
  })),
);
const slices = computed(() => {
  const visible = selectedRoles.value.length
    ? roles.value.filter((role) =>
        selectedRoles.value.includes(role.designation),
      )
    : roles.value;
  const sum = (key: "billable_hours" | "non_billable_hours") =>
    visible.reduce((total, role) => total + role[key], 0);
  return [
    { category: "Billable hours", hours: sum("billable_hours") },
    { category: "Non-billable hours", hours: sum("non_billable_hours") },
  ];
});
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
    />
  </div>
</template>
