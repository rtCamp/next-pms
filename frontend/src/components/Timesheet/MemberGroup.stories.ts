import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import { APPROVAL_STATUSES } from "@/components/ApprovalStatus";
import MemberGroup from "./MemberGroup.vue";
import ProjectGroup from "./ProjectGroup.vue";
import TaskWeekRow from "./TaskWeekRow.vue";
import TimeOffWeekRow from "./TimeOffWeekRow.vue";
import { NO_APPROVAL_STATUS } from "./constants";
import {
  HOLIDAYS,
  LEAVES,
  TASKS,
  TRIAGE_TASK,
  WEEK_DATES,
} from "./WeekGroup.fixtures";

const meta = {
  title: "Components/Timesheet/MemberGroup",
  component: MemberGroup,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Asha Rao",
    dates: WEEK_DATES,
    tasks: TASKS,
    leaves: LEAVES,
    holidays: HOLIDAYS,
    workingHour: 8,
    workingFrequency: "Per Day",
    status: "Approval Pending",
    onAction: fn(),
    onCellClick: fn(),
  },
  argTypes: {
    status: {
      control: "select",
      options: [...APPROVAL_STATUSES, NO_APPROVAL_STATUS],
    },
  },
  render: (args) => ({
    components: { MemberGroup, ProjectGroup, TaskWeekRow, TimeOffWeekRow },
    setup: () => ({
      args,
      atlasTasks: { [TRIAGE_TASK.name]: TRIAGE_TASK },
      triage: TRIAGE_TASK,
    }),
    template: `
      <MemberGroup v-bind="args">
        <template #default="{ dailyHours }">
          <ProjectGroup
            class="pl-7.5"
            label="Atlas UI Stabilization"
            :dates="args.dates"
            :tasks="atlasTasks"
          >
            <TaskWeekRow
              class="pl-13.5"
              :dates="args.dates"
              :task="triage"
              hide-star-button
            />
          </ProjectGroup>
          <TimeOffWeekRow
            class="pl-7.5"
            :dates="args.dates"
            :leaves="args.leaves"
            :holidays="args.holidays"
            :daily-hours="dailyHours"
          />
        </template>
      </MemberGroup>
    `,
  }),
} satisfies Meta<typeof MemberGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Expanded: Story = { args: { defaultCollapsed: false } };

export const ApprovedAndLocked: Story = {
  args: { status: "Approved", disabled: true },
};

export const NotSubmitted: Story = {
  args: { status: "Not Submitted", hideAction: true },
};
