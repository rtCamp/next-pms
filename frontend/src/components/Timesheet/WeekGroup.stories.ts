import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import { APPROVAL_STATUSES } from "@/components/ApprovalStatus";
import HeaderRow from "./HeaderRow.vue";
import LoadMoreRow from "./LoadMoreRow.vue";
import MemberGroup from "./MemberGroup.vue";
import ProjectGroup from "./ProjectGroup.vue";
import TaskWeekRow from "./TaskWeekRow.vue";
import TimeOffWeekRow from "./TimeOffWeekRow.vue";
import TotalRow from "./TotalRow.vue";
import WeekGroup from "./WeekGroup.vue";
import { NO_APPROVAL_STATUS } from "./constants";
import { dayLabels } from "./utils";
import {
  DOCS_TASK,
  HOLIDAYS,
  LEAVES,
  RESPONSIVENESS_TASK,
  TASKS,
  TRIAGE_TASK,
  WEEK_DATES,
} from "./WeekGroup.fixtures";

const meta = {
  title: "Components/Timesheet/WeekGroup",
  component: WeekGroup,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Dec 29 - Jan 4, 2026",
    dates: WEEK_DATES,
    status: "Not Submitted",
    tasks: TASKS,
    leaves: LEAVES,
    holidays: HOLIDAYS,
    workingHour: 8,
    workingFrequency: "Per Day",
    onSubmit: fn(),
    onToggle: fn(),
  },
  argTypes: {
    status: {
      control: "select",
      options: [...APPROVAL_STATUSES, NO_APPROVAL_STATUS],
    },
  },
  render: (args) => ({
    components: {
      WeekGroup,
      HeaderRow,
      TotalRow,
      ProjectGroup,
      TaskWeekRow,
      TimeOffWeekRow,
    },
    setup: () => ({
      args,
      days: dayLabels(WEEK_DATES),
      cmsTasks: {
        [RESPONSIVENESS_TASK.name]: RESPONSIVENESS_TASK,
        [DOCS_TASK.name]: DOCS_TASK,
      },
      atlasTasks: { [TRIAGE_TASK.name]: TRIAGE_TASK },
      responsiveness: RESPONSIVENESS_TASK,
      docs: DOCS_TASK,
      triage: TRIAGE_TASK,
    }),
    template: `
      <div class="h-96 overflow-y-auto">
        <div class="sticky top-0 z-20 bg-surface-base">
          <HeaderRow :levels="['Week', 'Project', 'Task']" :days="days" />
        </div>
        <WeekGroup v-bind="args" class="pl-3">
          <template #default="{ totalHours, totalHoursTheme, totalCells, dailyHours }">
            <TotalRow
              class="pl-7.5"
              :levels="['Projects', 'Tasks']"
              :total-time-entries="totalCells"
              :total-hours="totalHours"
              :total-hours-theme="totalHoursTheme"
            />
            <ProjectGroup
              class="pl-7.5"
              label="Blue Harbour CMS Migration"
              :dates="args.dates"
              :tasks="cmsTasks"
              :backdate-restricted-before="args.backdateRestrictedBefore"
            >
              <TaskWeekRow
                class="pl-13.5"
                :dates="args.dates"
                :task="responsiveness"
                :backdate-restricted-before="args.backdateRestrictedBefore"
              />
              <TaskWeekRow
                class="pl-13.5"
                :dates="args.dates"
                :task="docs"
                :backdate-restricted-before="args.backdateRestrictedBefore"
              />
            </ProjectGroup>
            <ProjectGroup
              class="pl-7.5"
              label="Atlas UI Stabilization"
              :dates="args.dates"
              :tasks="atlasTasks"
              :backdate-restricted-before="args.backdateRestrictedBefore"
            >
              <TaskWeekRow
                class="pl-13.5"
                :dates="args.dates"
                :task="triage"
                :backdate-restricted-before="args.backdateRestrictedBefore"
              />
            </ProjectGroup>
            <TimeOffWeekRow
              class="mt-3 pl-7.5"
              :dates="args.dates"
              :leaves="args.leaves"
              :holidays="args.holidays"
              :daily-hours="dailyHours"
            />
          </template>
        </WeekGroup>
      </div>
    `,
  }),
} satisfies Meta<typeof WeekGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Personal: Story = {};

export const Collapsed: Story = { args: { defaultCollapsed: true } };

export const Approved: Story = { args: { status: "Approved" } };

export const BackdateRestricted: Story = {
  args: { backdateRestrictedBefore: WEEK_DATES[2] },
};

export const TeamWeek: Story = {
  args: {
    label: "Last week",
    status: undefined,
    readOnly: true,
    tasks: undefined,
    approvalPendingCount: 2,
  },
  render: (args) => ({
    components: { WeekGroup, MemberGroup, LoadMoreRow },
    setup: () => ({ args, tasks: TASKS, leaves: LEAVES, holidays: HOLIDAYS }),
    template: `
      <WeekGroup v-bind="args" class="pl-3">
        <MemberGroup
          class="pl-7.5"
          label="Asha Rao"
          status="Approval Pending"
          :dates="args.dates"
          :tasks="tasks"
          :leaves="leaves"
          :holidays="holidays"
          :working-hour="8"
          working-frequency="Per Day"
        />
        <LoadMoreRow has-more />
      </WeekGroup>
    `,
  }),
};
