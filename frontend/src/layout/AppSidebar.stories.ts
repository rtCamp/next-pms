import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import AppSidebar from "./AppSidebar.vue";
import { SIDEBAR_COLLAPSED_KEY } from "./constants";

const meta = {
  title: "Layout/AppSidebar",
  component: AppSidebar,
  tags: ["autodocs"],
  args: {
    roles: [],
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

/** An employee without review or project roles: their own timesheet, tasks and allocations. */
export const Employee: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "Timesheet" }),
    ).toHaveAttribute("href", "/timesheet");
    await expect(
      canvas.getByRole("link", { name: "Tasks" }),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: "Projects" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Dashboards" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Timesheet" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Allocations" }),
    ).toBeInTheDocument();
  },
};

/** A timesheet reviewer gets a Timesheet section; Team opens on their reports. */
export const TimesheetReviewer: Story = {
  args: { roles: ["Timesheet User"] },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Timesheet" }));
    await expect(
      canvas.getByRole("link", { name: "Personal" }),
    ).toHaveAttribute("href", "/timesheet");
    await expect(canvas.getByRole("link", { name: "Team" })).toHaveAttribute(
      "href",
      "/timesheet/team?reportsTo=HR-EMP-00042",
    );
    await expect(
      canvas.getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("href", "/timesheet/project");
  },
};

/** A projects manager sees open projects and, with one dashboard, has it at the top. */
export const ProjectsManager: Story = {
  args: { roles: ["Projects Manager"] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("href", "/projects?status=Open");
    await expect(canvas.getByRole("link", { name: "Manager" })).toHaveAttribute(
      "href",
      "/dashboard/manager",
    );
    await expect(
      canvas.queryByRole("button", { name: "Dashboards" }),
    ).not.toBeInTheDocument();
  },
};

/** Two dashboards go into their own section. */
export const Leadership: Story = {
  args: { roles: ["Delivery Manager"] },
  play: async ({ canvas }) => {
    const section = canvas.getByRole("button", { name: "Dashboards" });
    await userEvent.click(section);
    await expect(
      canvas.getByRole("link", { name: "Leadership" }),
    ).toHaveAttribute("href", "/dashboard/leadership");
    await expect(canvas.getByRole("link", { name: "Manager" })).toHaveAttribute(
      "href",
      "/dashboard/manager",
    );
  },
};

/** Sections start closed and open from their label. */
export const OpenSection: Story = {
  play: async ({ canvas }) => {
    const section = canvas.getByRole("button", { name: "Allocations" });
    await expect(section).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(section);
    await expect(section).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: "Team" })).toHaveAttribute(
      "href",
      "/allocations/team",
    );
  },
};

/** The toggle collapses the sidebar to icons and remembers the choice. */
export const Collapse: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Collapse" }));
    await expect(
      canvas.getByRole("button", { name: "Expand" }),
    ).toBeInTheDocument();
    await expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("true");
  },
};

/** Collapsed, the sidebar shows closed sections' icons too, and expanding it closes them again. */
export const CollapsedShowsClosedSections: Story = {
  play: async ({ canvas }) => {
    // Sections remount on collapse; re-query.
    const team = () => canvas.getByRole("link", { name: "Team", hidden: true });
    await expect(team()).not.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Collapse" }));
    await expect(team()).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Projects", hidden: true }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Expand" }));
    await expect(team()).not.toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Allocations", hidden: true }),
    ).toHaveAttribute("aria-expanded", "false");
  },
};

/** On a phone the sidebar collapses by itself, and closed sections still show their icons. */
export const MobileCollapsedShowsClosedSections: Story = {
  globals: { viewport: { value: "mobile1" } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Expand" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        canvas.getByRole("link", { name: "Team", hidden: true }),
      ).toBeVisible(),
    );
  },
};

/** Log out sits in the header menu and is left to the parent. */
export const LogOut: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Next PMS/ }));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Log out" }),
    );
    await waitFor(() => expect(args.onLogout).toHaveBeenCalledOnce());
  },
};
