import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import AppSidebar from "./AppSidebar.vue";
import { APPS } from "./AppSidebar.fixtures";
import { SIDEBAR_COLLAPSED_KEY } from "./constants";

const meta = {
  title: "Layout/AppSidebar",
  component: AppSidebar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    roles: [],
    employee: "HR-EMP-00042",
    employeeName: "Asha Rao",
    apps: APPS,
    onLogout: fn(),
  },
  beforeEach: () => {
    // Each story starts expanded, whatever an earlier one stored.
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
  },
  render: (args) => ({
    components: { AppSidebar },
    setup: () => ({ args }),
    template: `
      <div class="flex h-[600px]">
        <AppSidebar v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An employee without review or project roles: their own timesheet, tasks and allocations. */
export const Employee: Story = {};

/** A timesheet reviewer gets a Timesheet section. */
export const TimesheetReviewer: Story = {
  args: { roles: ["Timesheet User"] },
};

/** A projects manager sees open projects and their dashboard. */
export const ProjectsManager: Story = {
  args: { roles: ["Projects Manager"] },
};

/** Two dashboards go into their own section. */
export const Leadership: Story = {
  args: { roles: ["Delivery Manager"] },
};

/** On a phone the sidebar collapses by itself. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};
