import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import {
  EMPLOYEE_CAPABILITIES,
  PMS_LEADERSHIP_CAPABILITIES,
  PROJECTS_MANAGER_CAPABILITIES,
  PROJECTS_USER_CAPABILITIES,
} from "@/session/capabilities.fixtures";
import AppSidebar from "./AppSidebar.vue";
import { SIDEBAR_COLLAPSED_KEY } from "./constants";

const meta = {
  title: "Layout/AppSidebar",
  component: AppSidebar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    roles: ["Employee"],
    capabilities: EMPLOYEE_CAPABILITIES,
    employee: "HR-EMP-00042",
    employeeName: "Asha Rao",
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

/** An employee: their own timesheet, tasks, allocations and notifications. */
export const Employee: Story = {};

/** A Projects User gets a Timesheet section and Projects. */
export const TimesheetReviewer: Story = {
  args: { roles: ["Projects User"], capabilities: PROJECTS_USER_CAPABILITIES },
};

/** A projects manager sees open projects and their dashboard. */
export const ProjectsManager: Story = {
  args: {
    roles: ["Projects Manager"],
    capabilities: PROJECTS_MANAGER_CAPABILITIES,
  },
};

/** Two dashboards go into their own section. */
export const Leadership: Story = {
  args: {
    roles: ["PMS Leadership"],
    capabilities: PMS_LEADERSHIP_CAPABILITIES,
  },
};

/** On a phone the sidebar collapses by itself. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};
