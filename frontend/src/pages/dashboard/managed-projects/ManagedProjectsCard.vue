<script setup lang="ts">
import { computed } from "vue";
import { Skeleton } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import { useSavedState } from "@/composables/useSavedState";
import { MANAGED_PROJECTS_CUSTOMERS_KEY } from "@/pages/dashboard/constants";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import WidgetFilter from "@/pages/dashboard/WidgetFilter.vue";
import { formatHours } from "@/utils/format";
import HoursBurnBar from "./HoursBurnBar.vue";

defineOptions({ inheritAttrs: false });

interface ProjectSummary {
  name: string;
  project_name: string;
  customer: string | null;
  total_hours_purchased: number;
  actual_time: number;
  total_hours_remaining: number;
  billable_hours: number;
  non_billable_hours: number;
}

const COLUMNS = [
  { label: "Projects", width: "minmax(0, 1fr)" },
  { label: "Remaining", width: "96px", align: "right" },
  { label: "Hours Burn", width: "140px" },
  { label: "Billable (last week)", width: "160px", align: "right" },
  { label: "Non-billable (last week)", width: "176px", align: "right" },
];

const projects = useDashboardCall<ProjectSummary[]>(
  "get_my_projects_summary",
  () => ({ days: 7 }),
);
const selectedCustomers = useSavedState<string[]>(
  MANAGED_PROJECTS_CUSTOMERS_KEY,
  [],
);

const all = computed(() => projects.data ?? []);
const customerOptions = computed(() =>
  [...new Set(all.value.map((p) => p.customer).filter(Boolean))].map(
    (customer) => ({ value: customer as string, label: customer as string }),
  ),
);
const rows = computed(() => {
  const selected = selectedCustomers.value;
  if (!selected.length || selected.length === customerOptions.value.length)
    return all.value;
  return all.value.filter((p) => p.customer && selected.includes(p.customer));
});
</script>

<template>
  <div
    v-if="projects.loading && !projects.data"
    class="flex flex-col gap-3 p-1"
    aria-busy="true"
  >
    <div class="flex items-center justify-between gap-4">
      <Skeleton class="h-6 w-40" />
      <Skeleton class="h-8 w-36 shrink-0" />
    </div>
    <div class="flex flex-col gap-2">
      <Skeleton v-for="row in 5" :key="row" class="h-8 w-full" />
    </div>
  </div>
  <template v-else>
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-lg-semibold text-ink-gray-8">Managed projects</h3>
      <WidgetFilter
        v-model="selectedCustomers"
        noun="customer"
        :options="customerOptions"
      />
    </div>
    <p v-if="!rows.length" class="py-8 text-center text-base text-ink-gray-5">
      No assigned projects.
    </p>
    <List
      v-else
      :columns="COLUMNS.map((column) => column.width)"
      aria-label="Managed projects"
      class="list-row-px-1"
    >
      <ListHeader>
        <ListHeaderCell
          v-for="column in COLUMNS"
          :key="column.label"
          :class="column.align === 'right' && 'justify-end'"
        >
          <span class="truncate text-sm text-ink-gray-5">
            {{ column.label }}
          </span>
        </ListHeaderCell>
      </ListHeader>
      <ListRows v-slot="{ item }" :items="rows">
        <ListRow>
          <ListCell class="min-w-0 gap-2">
            <span
              class="lucide-folder size-4 shrink-0 text-ink-gray-5"
              aria-hidden="true"
            />
            <span class="truncate text-base-medium text-ink-gray-7">
              {{ item.project_name }}
            </span>
          </ListCell>
          <ListCell class="justify-end">
            <span class="truncate text-base text-ink-gray-6">
              {{ formatHours(item.total_hours_remaining) }}
            </span>
          </ListCell>
          <ListCell>
            <HoursBurnBar
              :used="item.actual_time"
              :total="item.total_hours_purchased"
            />
          </ListCell>
          <ListCell class="justify-end">
            <span class="truncate text-base text-ink-gray-6">
              {{ formatHours(item.billable_hours) }}
            </span>
          </ListCell>
          <ListCell class="justify-end">
            <span class="truncate text-base text-ink-gray-6">
              {{ formatHours(item.non_billable_hours) }}
            </span>
          </ListCell>
        </ListRow>
      </ListRows>
    </List>
  </template>
</template>
