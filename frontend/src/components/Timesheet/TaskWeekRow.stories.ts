import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import TaskWeekRow from "./TaskWeekRow.vue";
import {
  DOCS_TASK,
  RESPONSIVENESS_TASK,
  WEEK_DATES,
} from "./WeekGroup.fixtures";

const meta = {
  title: "Components/Timesheet/TaskWeekRow",
  component: TaskWeekRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    dates: WEEK_DATES,
    task: RESPONSIVENESS_TASK,
    onCellClick: fn(),
    onStar: fn(),
    onLabelClick: fn(),
  },
  render: (args) => ({
    components: { TaskWeekRow },
    setup: () => ({ args }),
    template: `<TaskWeekRow v-bind="args" />`,
  }),
} satisfies Meta<typeof TaskWeekRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Statuses: Story = {};

export const NonBillable: Story = { args: { task: DOCS_TASK, starred: true } };

export const Disabled: Story = { args: { disabled: true } };

export const BackdateRestricted: Story = {
  args: { backdateRestrictedBefore: WEEK_DATES[3] },
};
