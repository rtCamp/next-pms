import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import TaskStatus from "./TaskStatus.vue";
import { TASK_STATUS_ICONS } from "./icons";
import { TASK_STATUSES, type TaskStatusValue } from "./types";

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

export const Icon: Story = { args: { status: "Working", variant: "icon" } };

export const AllStatusIcons: Story = {
  render: () => ({
    components: { TaskStatus },
    setup: () => ({ statuses: TASK_STATUSES }),
    template: `
      <div class="flex flex-col gap-2 text-base text-ink-gray-6">
        <div v-for="status in statuses" :key="status" class="flex items-center gap-2">
          <TaskStatus :status="status" variant="icon" />
          <span>{{ status }}</span>
        </div>
      </div>
    `,
  }),
};

export const IconNamesEveryStatus: Story = {
  tags: ["interaction"],
  render: AllStatusIcons.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const status of TASK_STATUSES) {
      const img = canvas.getByRole("img", { name: status });
      await expect(img).toHaveAttribute("title", status);
      await expect(
        img.querySelector(`.${TASK_STATUS_ICONS[status].icon}`),
      ).not.toBeNull();
    }
  },
};

export const IconHasNoLabelText: Story = {
  tags: ["interaction"],
  args: { status: "Overdue", variant: "icon" },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole("img", { name: "Overdue" });
    await expect(img).toHaveTextContent("");
    await expect(img.querySelector(".lucide-timer")).not.toBeNull();
  },
};

export const IconUnknownStatusUsesOpen: Story = {
  tags: ["interaction"],
  args: { status: LONG_STATUS, variant: "icon" },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole("img", { name: LONG_STATUS });
    await expect(
      img.querySelector(`.${TASK_STATUS_ICONS.Open.icon}`),
    ).not.toBeNull();
  },
};
