import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TaskProgress from "./TaskProgress.vue";

const meta = {
  title: "Components/TaskProgress",
  component: TaskProgress,
  tags: ["autodocs"],
  args: { value: 45, size: "md" },
  argTypes: {
    value: { control: { type: "number", min: 0 } },
    size: { control: "select", options: ["sm", "md"] },
    label: { control: "text" },
  },
  render: (args) => ({
    components: { TaskProgress },
    setup: () => ({ args }),
    template: `
      <div class="w-80 p-4">
        <TaskProgress v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof TaskProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Complete: Story = { args: { value: 100 } };

export const Overflow: Story = { args: { value: 125 } };

export const Small: Story = { args: { value: 140, size: "sm" } };

export const Empty: Story = { args: { value: 0 } };
