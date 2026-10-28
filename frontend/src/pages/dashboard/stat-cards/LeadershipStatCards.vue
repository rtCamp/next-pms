<script setup lang="ts">
import { useDashboardCall } from "@/pages/dashboard/dashboardCall";
import { LEADERSHIP_STAT_HELP } from "@/pages/dashboard/help";
import { ACTIVE_PROJECTS_URL, AT_RISK_PROJECTS_URL } from "./links";
import StatCard from "./StatCard.vue";
import type { MembersWithoutAllocation } from "./types";

const activeProjects = useDashboardCall<number>("get_active_projects_count");
const atRiskProjects = useDashboardCall<number>("get_at_risk_projects_count");
const membersWithoutAllocation = useDashboardCall<MembersWithoutAllocation>(
  "get_members_without_allocation",
  () => ({ days: 30 }),
);
const nonBillableHours = useDashboardCall<number>(
  "get_non_billable_hours",
  () => ({ days: 30 }),
);
</script>

<template>
  <div class="flex w-full gap-3">
    <StatCard
      label="Active billable projects"
      :value="activeProjects.data ?? undefined"
      :loading="activeProjects.loading && activeProjects.data == null"
      :to="ACTIVE_PROJECTS_URL"
    />
    <StatCard
      label="At risk projects"
      :help="LEADERSHIP_STAT_HELP.atRiskProjects"
      :value="atRiskProjects.data ?? undefined"
      :loading="atRiskProjects.loading && atRiskProjects.data == null"
      :to="AT_RISK_PROJECTS_URL"
    />
    <StatCard
      label="Members without allocation"
      :help="LEADERSHIP_STAT_HELP.membersWithoutAllocation"
      sub-label="this month"
      :value="membersWithoutAllocation.data?.count"
      :loading="
        membersWithoutAllocation.loading &&
        membersWithoutAllocation.data == null
      "
    />
    <StatCard
      label="Non-billable hours logged"
      :help="LEADERSHIP_STAT_HELP.nonBillableHours"
      sub-label="this month"
      :value="nonBillableHours.data ?? undefined"
      :loading="nonBillableHours.loading && nonBillableHours.data == null"
    />
  </div>
</template>
