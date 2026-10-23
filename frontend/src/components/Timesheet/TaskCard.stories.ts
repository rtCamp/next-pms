import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { TASK_STATUSES } from "@/components/TaskStatus";
import TaskCard from "./TaskCard.vue";
import { CARD } from "./TaskRow.fixtures";

const meta = {
  title: "Components/Timesheet/TaskCard",
  component: TaskCard,
  tags: ["autodocs"],
  args: { ...CARD },
  argTypes: {
    status: { control: "select", options: [...TASK_STATUSES] },
  },
  render: (args) => ({
    components: { TaskCard },
    setup: () => ({ args }),
    template: `<TaskCard v-bind="args" />`,
  }),
} satisfies Meta<typeof TaskCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OverEstimate: Story = {
  args: { actualHours: 15, estimatedHours: 12, status: "Overdue" },
};

export const WithoutBadges: Story = {
  args: { projectName: undefined, dueDate: undefined },
};

export const NoEstimate: Story = { args: { estimatedHours: 0 } };
