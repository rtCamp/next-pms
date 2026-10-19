<script setup lang="ts">
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import { AT_RISK_PROJECTS_URL } from "./links";
import StatCard from "./StatCard.vue";
import type {
  MembersWithoutAllocation,
  OutstandingTimesheets,
  TimesheetToReview,
} from "./types";

const atRiskProjects = useDashboardCall<number>("get_at_risk_projects_count");
const membersWithoutAllocation = useDashboardCall<MembersWithoutAllocation>(
  "get_members_without_allocation",
  () => ({ days: 7 }),
);
const timesheetsToReview = useDashboardCall<TimesheetToReview[]>(
  "get_timesheets_to_review",
  () => ({ days: 7 }),
);
const outstandingTimesheets = useDashboardCall<OutstandingTimesheets>(
  "get_outstanding_timesheets",
);
</script>

<template>
  <div class="flex w-full gap-3">
    <StatCard
      label="At risk projects"
      :value="atRiskProjects.data ?? undefined"
      :loading="atRiskProjects.loading && atRiskProjects.data == null"
      :to="AT_RISK_PROJECTS_URL"
    />
    <StatCard
      label="Members without allocation"
      sub-label="this week"
      :value="membersWithoutAllocation.data?.count"
      :loading="
        membersWithoutAllocation.loading &&
        membersWithoutAllocation.data == null
      "
    />
    <StatCard
      label="Timesheets to review"
      sub-label="this week"
      :value="timesheetsToReview.data?.length"
      :loading="timesheetsToReview.loading && timesheetsToReview.data == null"
    />
    <StatCard
      label="Outstanding timesheets"
      :value="outstandingTimesheets.data?.count"
      :loading="
        outstandingTimesheets.loading && outstandingTimesheets.data == null
      "
    />
  </div>
</template>
