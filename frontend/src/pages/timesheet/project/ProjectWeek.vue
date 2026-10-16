<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  LoadMoreRow,
  MemberGroup,
  mergeMemberTasks,
  ProjectGroup,
  resolveProjectApprovalStatus,
  TimeOffWeekRow,
  WeekGroup,
} from "@/components/Timesheet";
import TeamTaskRow from "@/pages/timesheet/team/TeamTaskRow.vue";
import type { WeeklyApprovalTarget } from "@/pages/timesheet/team/weekly-approval/types";
import { useTimesheetDialogs } from "@/pages/timesheet/useTimesheetDialogs";
import type {
  ProjectFilterArgs,
  ProjectMember,
  ProjectWeekSummary,
} from "./types";
import { useProjectTimesheet } from "./useProjectTimesheet";
import { useProjectWeekProjects } from "./useProjectWeekProjects";

const props = defineProps<{
  week: ProjectWeekSummary;
  /** Filter arguments the week was loaded with. */
  filterArgs: ProjectFilterArgs;
  defaultCollapsed?: boolean;
}>();

const emit = defineEmits<{ review: [target: WeeklyApprovalTarget] }>();

const timesheet = useProjectTimesheet();
const dialogs = useTimesheetDialogs();

const opened = ref(!props.defaultCollapsed);

const projects = useProjectWeekProjects({
  startDate: props.week.start_date,
  filterArgs: props.filterArgs,
  enabled: opened,
});

let unregister: (() => void) | undefined;
watch(
  opened,
  (isOpened) => {
    if (isOpened && !unregister) {
      unregister = timesheet.registerProjectRefresh(
        props.week.start_date,
        projects.refreshEmployeeWeek,
      );
    }
  },
  { immediate: true },
);
onBeforeUnmount(() => unregister?.());

const rows = computed(() =>
  projects.projects.map((project) => {
    const approvable = new Set(project.approvable_employees ?? []);
    return {
      project,
      label: project.project_name || project.project,
      tasks: mergeMemberTasks(project.members),
      members: project.members.map((member) => {
        // The member's share of this project, not their whole week.
        const projectStatus = resolveProjectApprovalStatus(member.tasks);
        return {
          member,
          projectStatus,
          canReview:
            approvable.has(member.employee) &&
            projectStatus !== "Not Submitted",
        };
      }),
    };
  }),
);

function review(member: ProjectMember, projectId: string, projectName: string) {
  emit("review", {
    employeeId: member.employee,
    employeeName: member.label,
    avatarUrl: member.avatar_url ?? undefined,
    startDate: props.week.dates[0],
    projectId,
    projectName,
  });
}
</script>

<template>
  <WeekGroup
    class="pl-3"
    :label="week.label"
    :dates="week.dates"
    read-only
    :default-collapsed="defaultCollapsed"
    @toggle="(collapsed) => !collapsed && (opened = true)"
  >
    <ProjectGroup
      v-for="row in rows"
      :key="row.project.project"
      class="pl-7.5"
      :label="row.label"
      :dates="week.dates"
      :tasks="row.tasks"
      :lock-approved="false"
      highlight-time-entries
      @cell-click="
        (date) =>
          dialogs.openAddTime({
            date,
            project: row.project.project,
            projectLabel: row.label,
          })
      "
    >
      <MemberGroup
        v-for="{ member, projectStatus, canReview } in row.members"
        :key="member.employee"
        class="pl-13.5"
        :label="member.label"
        :avatar-url="member.avatar_url ?? undefined"
        :dates="week.dates"
        :tasks="member.tasks"
        :leaves="member.leaves"
        :holidays="member.holidays"
        :working-hour="member.working_hour"
        :working-frequency="member.working_frequency"
        :status="projectStatus"
        :hide-action="!canReview"
        :disabled="member.status === 'Approved'"
        :backdate-restricted-before="member.backdate_restricted_before"
        @cell-click="
          (date) =>
            dialogs.openAddTime({
              date,
              employeeId: member.employee,
              employeeLabel: member.label,
              project: row.project.project,
              projectLabel: row.label,
            })
        "
        @action="review(member, row.project.project, row.label)"
      >
        <template #default="{ hoursPerDay, dailyHours }">
          <TeamTaskRow
            v-for="(task, taskKey) in member.tasks"
            :key="taskKey"
            class="pl-19.5"
            :dates="week.dates"
            :task-key="String(taskKey)"
            :task="task"
            :employee-id="member.employee"
            :disabled="
              member.status === 'Approved' ||
              member.status === 'Processing Timesheet'
            "
            :backdate-restricted-before="member.backdate_restricted_before"
            :daily-hours="dailyHours"
            :hours-per-day="hoursPerDay"
          />
          <TimeOffWeekRow
            class="pl-19.5"
            :dates="week.dates"
            :leaves="member.leaves"
            :holidays="member.holidays"
            :daily-hours="dailyHours"
          />
        </template>
      </MemberGroup>
    </ProjectGroup>
    <LoadMoreRow
      :loading="!timesheet.isFilterRequest && projects.loading"
      :has-more="!timesheet.isFilterRequest && projects.hasMore"
      :empty="projects.projects.length === 0"
      @load-more="projects.loadMore()"
    />
  </WeekGroup>
</template>
