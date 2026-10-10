import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import TaskStatus from "./TaskStatus.vue";
import { TASK_STATUSES, type TaskStatusValue } from "./types";

const meta = {
  title: "Components/TaskStatus",
  component: TaskStatus,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { status: "Open" },
  argTypes: {
    status: { control: "select", options: [...TASK_STATUSES] },
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

export const AllStatuses: Story = {
  render: () => ({
    components: { TaskStatus },
    setup: () => ({ statuses: TASK_STATUSES }),
    template: `
      <div class="flex flex-col items-start gap-2">
        <TaskStatus v-for="status in statuses" :key="status" :status="status" />
      </div>
    `,
  }),
};

const LONG_STATUS =
  "Waiting on client feedback for the second design round" as TaskStatusValue;

export const LongUnknownStatus: Story = {
  tags: ["interaction"],
  args: { status: LONG_STATUS },
  play: async ({ canvasElement }) => {
    const pill = within(canvasElement).getByTitle(LONG_STATUS);
    await expect(pill).toHaveTextContent(LONG_STATUS);

    const label = within(pill).getByText(LONG_STATUS);
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  },
};

export const ShowsStatusAndTitle: Story = {
  tags: ["interaction"],
  args: { status: "Pending Review" },
  play: async ({ canvasElement }) => {
    const pill = within(canvasElement).getByTitle("Pending Review");
    await expect(pill).toHaveTextContent("Pending Review");
  },
};
