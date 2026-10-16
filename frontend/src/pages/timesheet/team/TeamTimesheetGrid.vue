<script setup lang="ts">
import { computed, ref } from "vue";
import { Spinner } from "frappe-ui";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { dayLabels, HeaderRow, LoadMoreRow } from "@/components/Timesheet";
import { useExpandedWeeks } from "@/pages/timesheet/useExpandedWeeks";
import TeamTaskLog from "./TeamTaskLog.vue";
import TeamWeek from "./TeamWeek.vue";
import { useTeamTimesheet } from "./useTeamTimesheet";
import type { WeeklyApprovalTarget } from "./weekly-approval/types";
import WeeklyApprovalDialog from "./weekly-approval/WeeklyApprovalDialog.vue";

defineOptions({ inheritAttrs: false });

const timesheet = useTeamTimesheet();
const expandedWeeks = useExpandedWeeks();

const days = computed(() => dayLabels(timesheet.weeks[0]?.dates ?? []));

const selectedTask = ref<string | null>(null);
const taskLogOpen = computed({
  get: () => selectedTask.value !== null,
  set: (open: boolean) => {
    if (!open) selectedTask.value = null;
  },
});

const reviewTarget = ref<WeeklyApprovalTarget | null>(null);
const reviewOpen = computed({
  get: () => reviewTarget.value !== null,
  set: (open: boolean) => {
    if (!open) reviewTarget.value = null;
  },
});
</script>

<template>
  <div
    v-if="
      expandedWeeks.loading ||
      (timesheet.isInitialLoad && timesheet.weeks.length === 0)
    "
    class="flex flex-1 items-center justify-center"
  >
    <Spinner class="size-6" />
  </div>
  <LoadingOverlay v-else :active="timesheet.isFilterRequest">
    <p
      v-if="timesheet.weeks.length === 0 && !timesheet.hasMoreWeeks"
      class="flex items-center justify-center text-base text-ink-gray-7"
    >
      No data
    </p>
    <div v-else class="min-h-0 flex-1 overflow-auto">
      <div class="min-w-[900px]">
        <div class="sticky top-0 z-20 bg-surface-base">
          <HeaderRow
            class="pl-2"
            :levels="['Week', 'Member', 'Project', 'Task']"
            :days="days"
          />
        </div>
        <TeamWeek
          v-for="(week, index) in timesheet.weeks"
          :key="`${timesheet.loadedKey}:${week.key}`"
          :class="index === 0 && 'mt-4'"
          :week="week"
          :filter-args="timesheet.loadedFilterArgs"
          :default-collapsed="index >= expandedWeeks.count"
          @label-click="selectedTask = $event"
          @review="reviewTarget = $event"
        />
        <LoadMoreRow
          :loading="timesheet.isLoading && !timesheet.isFilterRequest"
          :has-more="!timesheet.isFilterRequest && timesheet.hasMoreWeeks"
          @load-more="timesheet.loadMore()"
        />
      </div>
    </div>
  </LoadingOverlay>
  <WeeklyApprovalDialog
    v-if="reviewTarget"
    v-model:open="reviewOpen"
    :target="reviewTarget"
  />
  <TeamTaskLog
    v-if="selectedTask"
    v-model:open="taskLogOpen"
    :task="selectedTask"
  />
</template>
