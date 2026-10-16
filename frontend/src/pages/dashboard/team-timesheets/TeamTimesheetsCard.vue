<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { Avatar, Select, Skeleton } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import { ApprovalStatus } from "@/components/ApprovalStatus";
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import { formatHours } from "@/utils/format";
import {
  LAST_WEEK,
  PERIOD_OPTIONS,
  periodDays,
  teamTimesheetUrl,
  type TeamTimesheet,
} from "./teamTimesheets";

defineOptions({ inheritAttrs: false });

const COLUMNS = [
  { label: "Members", width: "minmax(0, 1fr)" },
  { label: "Billable h", width: "96px", align: "right" },
  { label: "Non-billable h", width: "112px", align: "right" },
  { label: "Expected h", width: "96px", align: "right" },
  { label: "Delta", width: "72px", align: "right" },
  { label: "Status", width: "48px", align: "right", hidden: true },
];

const period = ref(LAST_WEEK);
const timesheets = useDashboardCall<TeamTimesheet[]>(
  "get_team_timesheets",
  () => ({ days: periodDays(period.value, new Date()) }),
);
</script>

<template>
  <div
    v-if="timesheets.loading"
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
      <h3 class="text-lg-semibold text-ink-gray-8">Timesheets</h3>
      <div class="w-fit shrink-0">
        <Select
          v-model="period"
          :options="PERIOD_OPTIONS"
          aria-label="Period"
        />
      </div>
    </div>
    <p
      v-if="!timesheets.data?.length"
      class="py-8 text-center text-base text-ink-gray-5"
    >
      No team timesheets.
    </p>
    <List
      v-else
      :columns="COLUMNS.map((column) => column.width)"
      aria-label="Team timesheets"
      class="list-row-px-1"
    >
      <ListHeader>
        <ListHeaderCell
          v-for="column in COLUMNS"
          :key="column.label"
          :class="column.align === 'right' && 'justify-end'"
        >
          <span
            class="truncate text-sm text-ink-gray-5"
            :class="column.hidden && 'sr-only'"
          >
            {{ column.label }}
          </span>
        </ListHeaderCell>
      </ListHeader>
      <ListRows v-slot="{ item }" :items="timesheets.data">
        <ListRow>
          <ListCell class="min-w-0 gap-2">
            <Avatar
              size="xs"
              :label="item.employee_name"
              :image="item.user_image ?? undefined"
            />
            <RouterLink
              :to="teamTimesheetUrl(item.employee)"
              class="truncate text-base-medium text-ink-gray-7 hover:underline"
            >
              {{ item.employee_name }}
            </RouterLink>
          </ListCell>
          <ListCell class="justify-end">
            <span class="text-base text-ink-gray-6">
              {{ formatHours(item.billable_hours) }}
            </span>
          </ListCell>
          <ListCell class="justify-end">
            <span class="text-base text-ink-gray-6">
              {{ formatHours(item.non_billable_hours) }}
            </span>
          </ListCell>
          <ListCell class="justify-end">
            <span class="text-base text-ink-gray-6">
              {{ formatHours(item.expected_hours) }}
            </span>
          </ListCell>
          <ListCell class="justify-end">
            <span class="text-base text-ink-gray-6">
              {{ formatHours(item.delta) }}
            </span>
          </ListCell>
          <ListCell class="justify-end">
            <ApprovalStatus :status="item.weekly_approval_status" />
          </ListCell>
        </ListRow>
      </ListRows>
    </List>
  </template>
</template>
