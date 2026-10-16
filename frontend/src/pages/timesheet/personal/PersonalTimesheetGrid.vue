<script setup lang="ts">
import { computed, ref } from "vue";
import { Spinner, useCall } from "frappe-ui";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { dayLabels, HeaderRow, LoadMoreRow } from "@/components/Timesheet";
import {
  DEFAULT_AUTO_EXPAND_WEEKS,
  PERSONAL_WEEKS_PER_PAGE,
} from "@/pages/timesheet/constants";
import PersonalTaskLog from "./PersonalTaskLog.vue";
import PersonalWeek from "./PersonalWeek.vue";
import { usePersonalTimesheet } from "./usePersonalTimesheet";

interface PmsSettings {
  auto_expand_weeks_by_default: number | null;
  use_system_auto_expand_weeks: boolean | number;
  system_auto_expand_weeks_by_default: number;
}

defineOptions({ inheritAttrs: false });

const timesheet = usePersonalTimesheet();

const settings = useCall<PmsSettings>({
  url: "/api/v2/method/next_pms.next_pms.doctype.pms_user_setting.pms_user_setting.get_pms_settings",
});

const expandedWeeks = computed(() => {
  const data = settings.data;
  if (data?.use_system_auto_expand_weeks) {
    return data.system_auto_expand_weeks_by_default;
  }
  return data?.auto_expand_weeks_by_default ?? DEFAULT_AUTO_EXPAND_WEEKS;
});

const weeks = computed(() => Object.values(timesheet.timesheetData.data));
const days = computed(() => dayLabels(weeks.value[0]?.dates ?? []));

const selectedTask = ref<string | null>(null);
const taskLogOpen = computed({
  get: () => selectedTask.value !== null,
  set: (open: boolean) => {
    if (!open) selectedTask.value = null;
  },
});
</script>

<template>
  <div
    v-if="settings.loading || (timesheet.isInitialLoad && weeks.length === 0)"
    class="flex flex-1 items-center justify-center"
  >
    <Spinner class="size-6" />
  </div>
  <LoadingOverlay v-else :active="timesheet.isFilterRequest">
    <p
      v-if="weeks.length === 0"
      class="flex items-center justify-center text-base text-ink-gray-7"
    >
      No data found
    </p>
    <div v-else class="min-h-0 flex-1 overflow-auto">
      <div class="min-w-[900px]">
        <div class="sticky top-0 z-20 bg-surface-base">
          <HeaderRow
            class="pl-2"
            :levels="['Week', 'Project', 'Task']"
            :days="days"
          />
        </div>
        <PersonalWeek
          v-for="(week, index) in weeks"
          :key="`${week.start_date}-${week.end_date}`"
          :class="index === 0 && 'mt-4'"
          :week="week"
          :leaves="timesheet.timesheetData.leaves"
          :holidays="timesheet.timesheetData.holidays"
          :working-hour="timesheet.timesheetData.working_hour"
          :working-frequency="timesheet.timesheetData.working_frequency"
          :default-collapsed="index >= expandedWeeks"
          :hide-total-row="timesheet.hasTaskFilter"
          @label-click="selectedTask = $event"
        />
        <LoadMoreRow
          :loading="timesheet.isLoading"
          :has-more="!timesheet.isFilterRequest && timesheet.hasMoreWeeks"
          :count="PERSONAL_WEEKS_PER_PAGE"
          @load-more="timesheet.loadMore()"
        />
      </div>
    </div>
  </LoadingOverlay>
  <PersonalTaskLog
    v-if="selectedTask"
    v-model:open="taskLogOpen"
    :task="selectedTask"
  />
</template>
