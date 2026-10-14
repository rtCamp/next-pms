import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import { TASK_STATUSES } from "@/components/TaskStatus";
import TaskCard from "./TaskCard.vue";
import TaskRow from "./TaskRow.vue";
import { CARD, LOCKED, WEEK, WITH_STATUSES } from "./TaskRow.fixtures";

const meta = {
  title: "Components/Timesheet/TaskRow",
  component: TaskRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "UI Responsiveness Testing",
    status: "Working",
    totalHours: "08:00",
    timeEntries: WEEK,
    onCellClick: fn(),
    onStar: fn(),
    onLabelClick: fn(),
  },
  argTypes: {
    status: { control: "select", options: [...TASK_STATUSES] },
  },
  render: (args) => ({
    components: { TaskRow, TaskCard },
    setup: () => ({ args, card: CARD }),
    template: `
      <TaskRow v-bind="args">
        <template #card><TaskCard v-bind="card" /></template>
      </TaskRow>
    `,
  }),
} satisfies Meta<typeof TaskRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Starred: Story = { args: { starred: true } };

export const WithoutStarButton: Story = { args: { hideStarButton: true } };

export const Overdue: Story = { args: { status: "Overdue" } };

export const ApprovalStatuses: Story = {
  args: { timeEntries: WITH_STATUSES, totalHours: "06:45" },
};

export const Locked: Story = {
  args: { timeEntries: LOCKED, totalHours: "03:00" },
};

export const LongLabel: Story = {
  args: {
    label:
      "Audit every legacy redirect rule and map it to the new CMS routing table before launch",
  },
};
