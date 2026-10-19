<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  groupTasksByProject,
  LoadMoreRow,
  MemberGroup,
  ProjectGroup,
  TimeOffWeekRow,
  WeekGroup,
} from "@/components/Timesheet";
import { useTimesheetDialogs } from "@/pages/timesheet/useTimesheetDialogs";
import TeamTaskRow from "./TeamTaskRow.vue";
import type { TeamFilterArgs, TeamMember, TeamWeekSummary } from "./types";
import { useTeamTimesheet } from "./useTeamTimesheet";
import { useTeamWeekMembers } from "./useTeamWeekMembers";
import type { WeeklyApprovalTarget } from "./weekly-approval/types";

const props = defineProps<{
  week: TeamWeekSummary;
  /** Filter arguments the week was loaded with. */
  filterArgs: TeamFilterArgs;
  defaultCollapsed?: boolean;
}>();

const emit = defineEmits<{
  labelClick: [task: string];
  review: [target: WeeklyApprovalTarget];
}>();

const timesheet = useTeamTimesheet();
const dialogs = useTimesheetDialogs();

const opened = ref(!props.defaultCollapsed);

const members = useTeamWeekMembers({
  startDate: props.week.start_date,
  filterArgs: props.filterArgs,
  enabled: opened,
});

let unregister: (() => void) | undefined;
watch(
  opened,
  (isOpened) => {
    if (isOpened && !unregister) {
      unregister = timesheet.registerMemberRefresh(
        props.week.start_date,
        members.refreshMember,
      );
    }
  },
  { immediate: true },
);
onBeforeUnmount(() => unregister?.());

const rows = computed(() =>
  members.members.map((member) => ({
    member,
    projects: groupTasksByProject(member.tasks),
  })),
);

function addTime(member: TeamMember, prefill: Record<string, string>) {
  dialogs.openAddTime({
    ...prefill,
    employeeId: member.employee,
    employeeLabel: member.employee_name,
  });
}

function review(member: TeamMember) {
  emit("review", {
    employeeId: member.employee,
    employeeName: member.employee_name,
    avatarUrl: member.image ?? undefined,
    startDate: props.week.dates[0],
  });
}
</script>

<template>
  <WeekGroup
    class="pl-3"
    :label="week.label"
    :dates="week.dates"
    read-only
    :approval-pending-count="week.approval_pending_count"
    :default-collapsed="defaultCollapsed"
    @toggle="(collapsed) => !collapsed && (opened = true)"
  >
    <MemberGroup
      v-for="{ member, projects } in rows"
      :key="member.employee"
      class="pl-7.5"
      :label="member.employee_name"
      :avatar-url="member.image ?? undefined"
      :dates="week.dates"
      :tasks="member.tasks"
      :leaves="member.leaves"
      :holidays="member.holidays"
      :working-hour="member.working_hour"
      :working-frequency="member.working_frequency"
      :status="member.status"
      :hide-action="member.status === 'Not Submitted'"
      :disabled="member.status === 'Approved'"
      :backdate-restricted-before="member.backdate_restricted_before"
      @cell-click="(date) => addTime(member, { date })"
      @action="review(member)"
    >
      <template #default="{ hoursPerDay, dailyHours }">
        <ProjectGroup
          v-for="project in projects"
          :key="project.project"
          class="pl-13.5"
          :label="project.projectName || project.project"
          :dates="week.dates"
          :tasks="project.tasks"
          :disabled="member.status === 'Approved'"
          :backdate-restricted-before="member.backdate_restricted_before"
          @cell-click="
            (date) =>
              addTime(member, {
                date,
                project: project.project,
                projectLabel: project.projectName || project.project,
              })
          "
        >
          <TeamTaskRow
            v-for="(task, taskKey) in project.tasks"
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
            @label-click="emit('labelClick', $event)"
          />
        </ProjectGroup>
        <TimeOffWeekRow
          class="pl-13.5"
          :dates="week.dates"
          :leaves="member.leaves"
          :holidays="member.holidays"
          :daily-hours="dailyHours"
        />
      </template>
    </MemberGroup>
    <LoadMoreRow
      :loading="!timesheet.isFilterRequest && members.loading"
      :has-more="!timesheet.isFilterRequest && members.hasMore"
      :empty="members.members.length === 0"
      @load-more="members.loadMore()"
    />
  </WeekGroup>
</template>
