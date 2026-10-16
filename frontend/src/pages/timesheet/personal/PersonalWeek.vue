<script setup lang="ts">
import { computed } from "vue";
import {
  groupTasksByProject,
  mergeImportedTasks,
  ProjectGroup,
  TimeOffWeekRow,
  TotalRow,
  WeekGroup,
  type TimesheetHoliday,
  type TimesheetLeave,
} from "@/components/Timesheet";
import { useSession, type WorkingFrequency } from "@/session";
import type { TimesheetWeek } from "@/pages/timesheet/types";
import { useImportedTasks } from "@/pages/timesheet/useImportedTasks";
import { useTimesheetDialogs } from "@/pages/timesheet/useTimesheetDialogs";
import PersonalTaskRow from "./PersonalTaskRow.vue";
import { usePersonalTimesheet } from "./usePersonalTimesheet";

const props = defineProps<{
  week: TimesheetWeek;
  leaves: TimesheetLeave[];
  holidays: TimesheetHoliday[];
  workingHour: number;
  workingFrequency: WorkingFrequency;
  defaultCollapsed?: boolean;
  /** Hides the total row and the project hours, while a task filter is on. */
  hideTotalRow?: boolean;
}>();

const emit = defineEmits<{ labelClick: [task: string] }>();

const session = useSession();
const dialogs = useTimesheetDialogs();
const timesheet = usePersonalTimesheet();

const { importedTasks, isWeekImported, importLikedTasks, clearImportedTasks } =
  useImportedTasks(() => props.week.dates[0] ?? "");

const disabled = computed(() => props.week.status === "Approved");

const projects = computed(() =>
  groupTasksByProject(
    mergeImportedTasks(props.week.tasks, importedTasks.value),
  ),
);

function toggleImport() {
  if (isWeekImported.value) clearImportedTasks();
  else importLikedTasks(timesheet.likedTasks);
}

function submitForApproval() {
  dialogs.openSubmitApproval({
    startDate: props.week.start_date,
    endDate: props.week.end_date,
    totalHours: props.week.total_hours,
  });
}
</script>

<template>
  <WeekGroup
    class="pl-3"
    :label="week.label ?? week.key"
    :dates="week.dates"
    :status="week.status"
    :tasks="week.tasks"
    :leaves="leaves"
    :holidays="holidays"
    :working-hour="workingHour"
    :working-frequency="workingFrequency"
    :backdate-restricted-before="session.backdateRestrictedBefore"
    :default-collapsed="defaultCollapsed"
    @submit="submitForApproval"
  >
    <template
      #default="{ totalHours, totalHoursTheme, totalCells, dailyHours }"
    >
      <TotalRow
        v-if="!hideTotalRow"
        class="pl-7.5"
        :levels="['Projects', 'Tasks']"
        :total-time-entries="totalCells"
        :total-hours="totalHours"
        :total-hours-theme="totalHoursTheme"
        :starred="isWeekImported"
        :disabled="disabled"
        @cell-click="(_, date) => dialogs.openAddTime({ date })"
        @star="toggleImport"
      />
      <ProjectGroup
        v-for="project in projects"
        :key="project.project"
        class="pl-7.5"
        :label="project.projectName || project.project"
        :dates="week.dates"
        :tasks="project.tasks"
        :hide-time="hideTotalRow"
        :disabled="disabled"
        :backdate-restricted-before="session.backdateRestrictedBefore"
        @cell-click="
          (date) =>
            dialogs.openAddTime({
              date,
              project: project.project,
              projectLabel: project.projectName || project.project,
            })
        "
      >
        <PersonalTaskRow
          v-for="(task, taskKey) in project.tasks"
          :key="taskKey"
          class="pl-13.5"
          :dates="week.dates"
          :task-key="String(taskKey)"
          :task="task"
          :disabled="disabled"
          :backdate-restricted-before="session.backdateRestrictedBefore"
          @label-click="emit('labelClick', $event)"
        />
      </ProjectGroup>
      <TimeOffWeekRow
        class="mt-3 pl-7.5"
        :dates="week.dates"
        :leaves="leaves"
        :holidays="holidays"
        :daily-hours="dailyHours"
      />
    </template>
  </WeekGroup>
</template>
