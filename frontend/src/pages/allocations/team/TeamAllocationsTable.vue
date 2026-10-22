<script setup lang="ts">
import { computed } from "vue";
import { Spinner } from "frappe-ui";
import { GanttGrid } from "@/components/GanttGrid";
import { useAllocationDialogs } from "@/pages/allocations/shared/useAllocationDialogs";
import { ROLE_ACCESS, useSession } from "@/session";
import TeamAllocationsToolbar from "./TeamAllocationsToolbar.vue";
import { provideTeamAllocations } from "./useTeamAllocations";

const team = provideTeamAllocations();
const dialogs = useAllocationDialogs();
const session = useSession();

const canManageAllocations = computed(() =>
  session.hasAnyRole(ROLE_ACCESS.manageAllocations),
);
const canManageAiAllocations = computed(() =>
  session.hasAnyRole(ROLE_ACCESS.manageAiAllocations),
);
const showWeekend = window.boot?.allow_weekend_entries ?? false;
const hasRows = computed(() => team.employees.length > 0);
</script>

<template>
  <div class="flex min-h-0 w-full flex-1 flex-col gap-3.5 py-3.5">
    <TeamAllocationsToolbar />
    <div class="relative min-h-0 w-full flex-1">
      <div
        v-if="hasRows"
        class="size-full"
        :class="
          team.isQueryLoading &&
          'pointer-events-none opacity-50 transition-opacity duration-150'
        "
      >
        <GanttGrid
          variant="team"
          :start-date="team.query.anchorDate"
          :week-count="team.query.weekCount"
          :employees="team.employees"
          row-header-label="Members"
          :show-weekend="showWeekend"
          :has-role-access="canManageAllocations"
          :can-manage-ai-allocations="canManageAiAllocations"
          :loading="team.isQueryLoading || team.isNextPageLoading"
          :has-more="team.hasMore"
          :scroll-reset-key="team.scrollResetKey"
          @add="dialogs.openAdd"
          @edit="dialogs.openEdit"
          @load-more="team.loadMore"
        />
      </div>
      <p
        v-else-if="!team.isQueryLoading"
        class="flex h-full items-center justify-center text-base text-ink-gray-8"
      >
        No Data
      </p>
      <div
        v-if="team.isQueryLoading"
        role="status"
        aria-label="Loading allocations"
        class="pointer-events-auto absolute inset-0 z-50 flex cursor-wait items-center justify-center"
      >
        <Spinner class="size-6" />
      </div>
    </div>
  </div>
</template>
