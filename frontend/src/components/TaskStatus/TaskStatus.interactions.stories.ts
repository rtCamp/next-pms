import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import TaskStatus from "./TaskStatus.vue";
import { TASK_STATUSES, type TaskStatusValue } from "./types";

const meta = {
  title: "Components/TaskStatus/Interactions",
  component: TaskStatus,
  tags: ["interaction"],
  args: { status: "Open" },
  render: (args) => ({
    components: { TaskStatus },
    setup: () => ({ args }),
    template: `<TaskStatus v-bind="args" />`,
  }),
} satisfies Meta<typeof TaskStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG_STATUS =
  "Waiting on client feedback for the second design round" as TaskStatusValue;

export const LongUnknownStatus: Story = {
  args: { status: LONG_STATUS, variant: "badge" },
  play: async ({ canvasElement }) => {
    const pill = within(canvasElement).getByTitle(LONG_STATUS);
    await expect(pill).toHaveTextContent(LONG_STATUS);

    const label = within(pill).getByText(LONG_STATUS);
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  },
};

export const ShowsStatusAndTitle: Story = {
  args: { status: "Pending Review", variant: "badge" },
  play: async ({ canvasElement }) => {
    const pill = within(canvasElement).getByTitle("Pending Review");
    await expect(pill).toHaveTextContent("Pending Review");
  },
};

export const IconNamesEveryStatus: Story = {
  render: () => ({
    components: { TaskStatus },
    setup: () => ({ statuses: TASK_STATUSES }),
    template: `
      <div class="flex flex-col gap-2">
        <TaskStatus v-for="status in statuses" :key="status" :status="status" variant="icon" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const status of TASK_STATUSES) {
      const img = canvas.getByRole("img", { name: status });
      await expect(img).toHaveAttribute("title", status);
    }
  },
};

export const IconHasNoLabelText: Story = {
  args: { status: "Overdue", variant: "icon" },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole("img", { name: "Overdue" });
    await expect(img).toHaveTextContent("");
  },
};

export const IconUnknownStatusKeepsItsName: Story = {
  args: { status: LONG_STATUS, variant: "icon" },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole("img", { name: LONG_STATUS });
    await expect(img).toHaveAttribute("title", LONG_STATUS);
  },
};
