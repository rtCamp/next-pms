<script setup lang="ts">
import { computed } from "vue";
import { ErrorMessage, Skeleton } from "frappe-ui";
import { useSavedState } from "@/composables/useSavedState";
import { UTILISATION_ROLES_KEY } from "@/pages/dashboard/constants";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import WidgetFilter from "@/pages/dashboard/WidgetFilter.vue";
import {
  filterBySelected,
  roleOptions as toRoleOptions,
} from "@/pages/dashboard/roles";
import { errorMessage } from "@/utils/errors";
import { utilisationSegments, type TimeUtilisationRole } from "./utilisation";
import UtilisationDonut from "./UtilisationDonut.vue";

defineOptions({ inheritAttrs: false });

const utilisation = useDashboardCall<{ roles: TimeUtilisationRole[] }>(
  "get_time_utilisation",
  () => ({ days: 30 }),
);
const selectedRoles = useSavedState<string[]>(UTILISATION_ROLES_KEY, []);

const roles = computed(() => utilisation.data?.roles ?? []);
const roleOptions = computed(() => toRoleOptions(roles.value));
const segments = computed(() =>
  utilisationSegments(filterBySelected(roles.value, selectedRoles.value)),
);
</script>

<template>
  <template v-if="utilisation.error && !utilisation.data">
    <h3 class="text-lg-semibold text-ink-gray-8">
      Utilised time in the past 30 days
    </h3>
    <ErrorMessage :message="errorMessage(utilisation.error)" />
  </template>
  <template v-else-if="utilisation.loading || !utilisation.data">
    <Skeleton class="h-6 w-56" aria-busy="true" />
    <div class="flex items-center gap-8">
      <Skeleton class="size-32 shrink-0 rounded-full" />
      <div class="flex grow flex-col gap-3">
        <Skeleton v-for="row in 2" :key="row" class="h-4 w-full" />
      </div>
    </div>
  </template>
  <template v-else>
    <div class="flex items-start justify-between gap-4">
      <h3 class="text-lg-semibold text-ink-gray-8">
        Utilised time in the past 30 days
      </h3>
      <WidgetFilter
        v-model="selectedRoles"
        noun="role"
        :options="roleOptions"
      />
    </div>
    <div class="flex items-center gap-8">
      <UtilisationDonut :segments="segments" />
      <ul class="flex grow flex-col gap-3">
        <li
          v-for="segment in segments"
          :key="segment.key"
          class="flex items-center justify-between gap-4"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="size-2 shrink-0 rounded-full"
              :class="segment.dotClass"
            />
            <span class="truncate text-base text-ink-gray-6">
              {{ segment.label }}
            </span>
          </div>
          <span class="text-base-medium text-ink-gray-6">
            {{ segment.value }}%
          </span>
        </li>
      </ul>
    </div>
  </template>
</template>
