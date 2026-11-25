import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  EMPLOYEE_CAPABILITIES,
  PMS_LEADERSHIP_CAPABILITIES,
  PROJECTS_MANAGER_CAPABILITIES,
  PROJECTS_USER_CAPABILITIES,
} from "@/session/capabilities.fixtures";
import { useWhatsNew } from "@/composables/useWhatsNew";
import AppSidebar from "./AppSidebar.vue";
import { SIDEBAR_COLLAPSED_KEY } from "./constants";

const meta = {
  title: "Layout/AppSidebar/Interactions",
  component: AppSidebar,
  tags: ["interaction"],
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
    const whatsNew = useWhatsNew();
    whatsNew.available = false;
    whatsNew.unseen = false;
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
    await expect(
      canvas.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
  },
};

/** Without the notifications capability there's no Notifications item. */
export const NoNotifications: Story = {
  args: { capabilities: {} },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole("button", { name: "Notifications" }),
    ).not.toBeInTheDocument();
  },
};

/** Notifications opens the tray beside the sidebar. */
export const Notifications: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Notifications" }),
    );
    const tray = await screen.findByRole("dialog", { name: "Notifications" });
    await waitFor(() => expect(tray).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/** A Projects User gets a Timesheet section, Team opening on their reports, and Projects. */
export const TimesheetReviewer: Story = {
  args: { roles: ["Projects User"], capabilities: PROJECTS_USER_CAPABILITIES },
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
      canvas
        .getAllByRole("link", { name: "Projects" })
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/projects?status=Open", "/timesheet/project"]);
  },
};

/** A projects manager sees open projects and, with one dashboard, has it at the top. */
export const ProjectsManager: Story = {
  args: {
    roles: ["Projects Manager"],
    capabilities: PROJECTS_MANAGER_CAPABILITIES,
  },
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
  args: {
    roles: ["PMS Leadership"],
    capabilities: PMS_LEADERSHIP_CAPABILITIES,
  },
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

/** Logout sits in the header menu and is left to the parent. */
export const LogOut: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Next PMS/ }));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Logout" }),
    );
    await waitFor(() => expect(args.onLogout).toHaveBeenCalledOnce());
  },
};

/** The header menu has React's items, in React's order. */
export const HeaderMenu: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Next PMS/ }));
    await screen.findByRole("menu");
    const labels = screen
      .getAllByRole("menuitem")
      .map((item) => item.textContent?.trim());
    await expect(labels).toEqual([
      "Apps",
      "Switch To Desk",
      "Settings",
      "Toggle Theme",
      "Logout",
    ]);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  },
};

// A new loader per render: the preload remembers loaders it has called.
let loadTasks = fn();

/** Hovering or focusing a link loads its page's code once, before the click. */
export const PreloadsPageCode: Story = {
  render: (args) => ({
    components: { AppSidebar },
    setup() {
      const router = useRouter();
      loadTasks = fn(async () => ({ render: () => null }));
      router.addRoute({
        path: "/tasks",
        name: "preload-tasks",
        component: loadTasks,
      });
      onUnmounted(() => router.removeRoute("preload-tasks"));
      return { args };
    },
    template: `
      <div class="flex h-[600px]">
        <AppSidebar v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const tasks = canvas.getByRole("link", { name: "Tasks" });
    await expect(loadTasks).not.toHaveBeenCalled();
    await userEvent.hover(tasks);
    await waitFor(() => expect(loadTasks).toHaveBeenCalledOnce());
    await userEvent.unhover(tasks);
    tasks.focus();
    await userEvent.hover(tasks);
    await expect(loadTasks).toHaveBeenCalledOnce();
  },
};

let storyRouter: ReturnType<typeof useRouter> | undefined;

const renderWithRouter: Story["render"] = (args) => ({
  components: { AppSidebar },
  setup() {
    storyRouter = useRouter();
    return { args };
  },
  template: `
    <div class="flex h-[600px]">
      <AppSidebar v-bind="args" />
    </div>
  `,
});

/** An unseen release: dots on the logo ("New release") and the menu item, which opens What's new. */
export const WhatsNewUnseen: Story = {
  beforeEach: () => {
    const whatsNew = useWhatsNew();
    whatsNew.available = true;
    whatsNew.unseen = true;
  },
  render: renderWithRouter,
  play: async ({ canvas }) => {
    const header = canvas.getByRole("button", { name: /Next PMS/ });
    await expect(within(header).getByText("New release")).toBeInTheDocument();
    await userEvent.click(header);
    await screen.findByRole("menu");
    const labels = screen
      .getAllByRole("menuitem")
      .map((item) => item.textContent?.trim());
    await expect(labels).toEqual([
      "Apps",
      "Switch To Desk",
      "Settings",
      "What's new",
      "Toggle Theme",
      "Logout",
    ]);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "What's new, new release" }),
    );
    await waitFor(() =>
      expect(storyRouter?.currentRoute.value.fullPath).toBe("/whats-new"),
    );
  },
};

/** Once the release is seen, the dots go and the menu item is plain "What's new". */
export const WhatsNewSeen: Story = {
  beforeEach: () => {
    useWhatsNew().available = true;
  },
  play: async ({ canvas }) => {
    const header = canvas.getByRole("button", { name: /Next PMS/ });
    await expect(within(header).queryByText("New release")).toBeNull();
    await userEvent.click(header);
    await expect(
      await screen.findByRole("menuitem", { name: "What's new" }),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  },
};

/** With release notes on the site, the search palette lists What's new. */
export const SearchWhatsNew: Story = {
  beforeEach: () => {
    useWhatsNew().available = true;
  },
  render: renderWithRouter,
  play: async () => {
    await userEvent.keyboard("{Control>}k{/Control}");
    const palette = await screen.findByRole("dialog", { name: "Search" });
    await userEvent.keyboard("what");
    await waitFor(() =>
      expect(
        within(palette)
          .getAllByRole("option")
          .map((option) => option.textContent?.trim()),
      ).toEqual(["What's new"]),
    );
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(storyRouter?.currentRoute.value.fullPath).toBe("/whats-new"),
    );
  },
};

/** Ctrl+K opens the search palette; it lists the user's pages and goes to the picked one. */
export const Search: Story = {
  args: {
    roles: ["Projects Manager"],
    capabilities: PROJECTS_MANAGER_CAPABILITIES,
  },
  render: (args) => ({
    components: { AppSidebar },
    setup() {
      storyRouter = useRouter();
      return { args };
    },
    template: `
      <div class="flex h-[600px]">
        <AppSidebar v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Search" }),
    ).toBeInTheDocument();

    await userEvent.keyboard("{Control>}k{/Control}");
    const palette = await screen.findByRole("dialog", { name: "Search" });
    await expect(
      within(palette).getByRole("option", { name: "Dashboard - Manager" }),
    ).toBeInTheDocument();
    await expect(
      within(palette).queryByRole("option", { name: "Dashboard - Leadership" }),
    ).not.toBeInTheDocument();

    await userEvent.keyboard("alloc");
    await waitFor(() =>
      expect(within(palette).getAllByRole("option")).toHaveLength(2),
    );
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(storyRouter?.currentRoute.value.fullPath).toBe(
        "/allocations/team",
      ),
    );
  },
};

/** Help opens the tips for the current page beside the sidebar, and closes again from the same item or Escape. */
export const Help: Story = {
  render: (args) => ({
    components: { AppSidebar },
    setup() {
      const router = useRouter();
      router.addRoute({
        path: "/tasks",
        name: "task",
        component: { render: () => null },
      });
      void router.push("/tasks");
      onUnmounted(() => {
        router.removeRoute("task");
        void router.push("/");
      });
      return { args };
    },
    template: `
      <div class="flex h-[600px]">
        <AppSidebar v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const help = canvas.getByRole("button", { name: "Help" });
    await expect(help).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(help);
    const panel = within(await screen.findByRole("dialog", { name: "Help" }));
    await waitFor(() =>
      expect(
        panel.getByRole("button", { name: "Add time from a task" }),
      ).toBeVisible(),
    );
    await expect(
      within(panel.getByRole("group", { name: "Everywhere" })).getByRole(
        "button",
        { name: "Jump anywhere with search" },
      ),
    ).toBeInTheDocument();
    await expect(help).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(help);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    // Escape closes it and puts focus back on the Help item.
    await userEvent.click(help);
    await screen.findByRole("dialog", { name: "Help" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(help).toHaveFocus());
  },
};

/** Ctrl+Shift+Comma opens Settings from anywhere. */
export const SettingsShortcut: Story = {
  play: async () => {
    await userEvent.keyboard("{Control>}{Shift>}[Comma]{/Shift}{/Control}");
    await expect(
      await screen.findByRole("tab", { name: "Profile" }),
    ).toBeVisible();
  },
};
