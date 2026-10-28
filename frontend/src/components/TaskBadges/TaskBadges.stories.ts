import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TaskBadges from "./TaskBadges.vue";

const meta = {
  title: "Components/TaskBadges",
  component: TaskBadges,
  tags: ["autodocs"],
  args: {
    projectName: "Blue Harbour CMS Migration",
    dueDate: "2026-10-30",
  },
  render: (args) => ({
    components: { TaskBadges },
    setup: () => ({ args }),
    template: `<div class="w-80"><TaskBadges v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof TaskBadges>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DueDateOnly: Story = { args: { projectName: undefined } };

export const ProjectOnly: Story = { args: { dueDate: undefined } };

export const LongProjectName: Story = {
  args: {
    projectName: "Initech Data Platform Migration and Warehouse Consolidation",
  },
};
