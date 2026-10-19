import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import GanttGrid from "./GanttGrid.vue";
import {
  EMPLOYEES,
  MANY_EMPLOYEES,
  PROJECTS,
  START_DATE,
} from "./GanttGrid.fixtures";

const meta = {
  title: "Components/GanttGrid",
  component: GanttGrid,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    variant: "team",
    startDate: START_DATE,
    weekCount: 3,
    employees: EMPLOYEES,
    rowHeaderLabel: "Members",
    showWeekend: true,
    hasRoleAccess: true,
    canManageAiAllocations: true,
    onAdd: fn(),
    onEdit: fn(),
    onDelete: fn(),
    onToggle: fn(),
    onLoadMore: fn(),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["team", "project"] },
    startDate: { control: "date" },
  },
  render: (args) => ({
    components: { GanttGrid },
    setup: () => ({ args }),
    template: `
      <div class="h-[560px] w-full">
        <GanttGrid v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof GanttGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Team: Story = {};

export const Project: Story = {
  args: {
    variant: "project",
    employees: undefined,
    projects: PROJECTS,
    rowHeaderLabel: "Projects",
  },
};

export const WithoutWeekends: Story = {
  args: { showWeekend: false },
};

export const OneWeek: Story = {
  args: { weekCount: 1 },
};

export const Quarter: Story = {
  args: { weekCount: 13 },
};

export const ReadOnly: Story = {
  args: { hasRoleAccess: false, canManageAiAllocations: false },
};

export const LoadingMore: Story = {
  args: { employees: MANY_EMPLOYEES, hasMore: true, loading: true },
};

export const Empty: Story = {
  args: { employees: [] },
};
