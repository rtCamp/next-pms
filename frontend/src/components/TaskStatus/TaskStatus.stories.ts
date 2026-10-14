import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TaskStatus from "./TaskStatus.vue";
import { TASK_STATUSES } from "./types";

const meta = {
  title: "Components/TaskStatus",
  component: TaskStatus,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { status: "Open" },
  argTypes: {
    status: { control: "select", options: [...TASK_STATUSES] },
    variant: { control: "select", options: ["badge", "icon"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  render: (args) => ({
    components: { TaskStatus },
    setup: () => ({ args }),
    template: `<TaskStatus v-bind="args" />`,
  }),
} satisfies Meta<typeof TaskStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { args: { status: "Open" } };
export const Working: Story = { args: { status: "Working" } };
export const PendingReview: Story = { args: { status: "Pending Review" } };
export const Overdue: Story = { args: { status: "Overdue" } };
export const TemplateStatus: Story = {
  name: "Template",
  args: { status: "Template" },
};
export const Completed: Story = { args: { status: "Completed" } };
export const Cancelled: Story = { args: { status: "Cancelled" } };

export const Icon: Story = { args: { status: "Working", variant: "icon" } };
