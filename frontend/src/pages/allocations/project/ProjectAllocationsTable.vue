<script setup lang="ts">
import { computed } from "vue";
import { Spinner } from "frappe-ui";
import { GanttGrid } from "@/components/GanttGrid";
import { useAllocationDialogs } from "@/pages/allocations/shared/useAllocationDialogs";
import { ROLE_ACCESS, useSession } from "@/session";
import ProjectAllocationsToolbar from "./ProjectAllocationsToolbar.vue";
import { provideProjectAllocations } from "./useProjectAllocations";

const project = provideProjectAllocations();
const dialogs = useAllocationDialogs();
const session = useSession();

const canManageAllocations = computed(() =>
  session.hasAnyRole(ROLE_ACCESS.manageAllocations),
);
const canManageAiAllocations = computed(() =>
  session.hasAnyRole(ROLE_ACCESS.manageAiAllocations),
);
const showWeekend = window.boot?.allow_weekend_entries ?? false;
const hasRows = computed(() => project.projects.length > 0);
</script>

<template>
  <div class="flex min-h-0 w-full flex-1 flex-col gap-3.5 py-3.5">
    <ProjectAllocationsToolbar />
    <div class="relative min-h-0 w-full flex-1">
      <div
        v-if="hasRows"
        class="size-full"
        :class="
          project.isQueryLoading &&
          'pointer-events-none opacity-50 transition-opacity duration-150'
        "
      >
        <GanttGrid
          variant="project"
          :start-date="project.query.anchorDate"
          :week-count="project.query.weekCount"
          :projects="project.projects"
          row-header-label="Projects"
          :show-weekend="showWeekend"
          :has-role-access="canManageAllocations"
          :can-manage-ai-allocations="canManageAiAllocations"
          :loading="project.isQueryLoading || project.isNextPageLoading"
          :has-more="project.hasMore"
          :scroll-reset-key="project.scrollResetKey"
          @add="dialogs.openAdd"
          @edit="dialogs.openEdit"
          @delete="dialogs.confirmDelete"
          @load-more="project.loadMore"
        />
      </div>
      <p
        v-else-if="!project.isQueryLoading"
        class="flex h-full items-center justify-center text-base text-ink-gray-8"
      >
        No Data
      </p>
      <div
        v-if="project.isQueryLoading"
        role="status"
        aria-label="Loading allocations"
        class="pointer-events-auto absolute inset-0 z-50 flex cursor-wait items-center justify-center"
      >
        <Spinner class="size-6" />
      </div>
    </div>
  </div>
</template>
