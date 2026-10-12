import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "frappe-ui";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import NotificationTray from "./NotificationTray.vue";
import type { NotificationEntry } from "./types";

const notifications: NotificationEntry[] = [
  {
    id: "n1",
    linkedDoctype: "Project Status Update",
    title: "You were mentioned",
    message: [
      { text: "Priya Sharma", emphasis: "strong" },
      { text: " mentioned you in " },
      { text: "Weekly update: Acme Website", emphasis: "subject" },
    ],
    timeLabel: "5m ago",
    href: "/next-pms/project/acme-website",
  },
  {
    id: "n2",
    linkedDoctype: "Risk",
    title: "New risk",
    message: [
      { text: "Rahul Verma", emphasis: "strong" },
      { text: " raised a high risk on " },
      { text: "Globex Mobile App", emphasis: "subject" },
    ],
    timeLabel: "1h ago",
    href: "/next-pms/project/globex-mobile",
  },
  {
    id: "n3",
    linkedDoctype: "Timesheet",
    title: "Timesheet rejected",
    message: [
      { text: "Your timesheet for " },
      { text: "Oct 5 - Oct 11", emphasis: "subject" },
      { text: " was rejected." },
    ],
    timeLabel: "Yesterday",
  },
  {
    id: "n4",
    linkedDoctype: "Project",
    title: "Added to project",
    message: [
      { text: "You were added to " },
      { text: "Initech Data Platform", emphasis: "subject" },
    ],
    timeLabel: "2d ago",
    read: true,
  },
  {
    id: "n5",
    linkedDoctype: "Customer Feedback",
    title: "Customer feedback",
    message: [
      { text: "Acme Corp", emphasis: "strong" },
      { text: " left feedback on the latest release." },
    ],
    timeLabel: "3d ago",
  },
  {
    id: "n6",
    linkedDoctype: "ToDo",
    message: [{ text: "A task was assigned to you." }],
    timeLabel: "1w ago",
  },
];

const many: NotificationEntry[] = Array.from({ length: 20 }, (_, index) => ({
  ...notifications[index % notifications.length]!,
  id: `many-${index}`,
  read: false,
}));

const meta = {
  title: "Components/NotificationTray",
  component: NotificationTray,
  tags: ["autodocs"],
  args: {
    open: true,
    notifications,
    offsetClass: "left-60",
    "onUpdate:open": fn(),
    onMarkAllRead: fn(),
    onNotificationClick: fn(),
  },
  argTypes: {
    offsetClass: {
      control: "select",
      options: ["left-0", "left-12", "left-60"],
    },
  },
  render: (args) => ({
    components: { NotificationTray, Button },
    setup: () => ({ args, open: ref(args.open ?? false) }),
    template: `
      <div
        class="fixed inset-y-0 left-0 flex flex-col gap-1 border-r border-outline-gray-1 bg-surface-sidebar p-2"
        :class="args.offsetClass === 'left-12' ? 'w-12' : 'w-60'"
      >
        <Button
          variant="ghost"
          icon-left="lucide-bell"
          label="Notifications"
          :class="args.offsetClass === 'left-12' ? '' : '!justify-start'"
          @click="open = true"
        />
      </div>
      <NotificationTray v-bind="args" v-model:open="open" />
    `,
  }),
} satisfies Meta<typeof NotificationTray>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { notifications: [] } };

export const AllRead: Story = {
  args: { notifications: notifications.map((n) => ({ ...n, read: true })) },
};

export const ManyNotifications: Story = { args: { notifications: many } };

export const CollapsedSidebar: Story = { args: { offsetClass: "left-12" } };

export const OpenAndClose: Story = {
  tags: ["interaction"],
  args: { open: false },
  play: async ({ canvasElement, args }) => {
    await expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Notifications" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Notifications",
    });
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close notifications tray" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(args["onUpdate:open"]).toHaveBeenLastCalledWith(false);
  },
};

export const EscapeCloses: Story = {
  tags: ["interaction"],
  play: async ({ args }) => {
    await screen.findByRole("dialog", { name: "Notifications" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(args["onUpdate:open"]).toHaveBeenLastCalledWith(false);
  },
};

export const ShowsOnlyUnread: Story = {
  tags: ["interaction"],
  play: async () => {
    const list = await screen.findByRole("list", {
      name: "Unread notifications",
    });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    await expect(within(list).queryByText("Added to project")).toBeNull();
    await expect(
      within(list).getByRole("link", { name: /You were mentioned/ }),
    ).toHaveAttribute("href", "/next-pms/project/acme-website");
    await waitFor(() =>
      expect(
        within(list).getByRole("button", { name: /Timesheet rejected/ }),
      ).toBeVisible(),
    );
  },
};

export const AllReadShowsEmptyState: Story = {
  ...AllRead,
  tags: ["interaction"],
  play: async () => {
    const dialog = await screen.findByRole("dialog", {
      name: "Notifications",
    });
    await waitFor(() =>
      expect(
        within(dialog).getByText("No unread notifications."),
      ).toBeVisible(),
    );
    await expect(within(dialog).queryByRole("list")).toBeNull();
  },
};

export const EmptyState: Story = {
  ...Empty,
  tags: ["interaction"],
  play: async () => {
    const dialog = await screen.findByRole("dialog", {
      name: "Notifications",
    });
    await waitFor(() =>
      expect(within(dialog).getByText("No notifications yet.")).toBeVisible(),
    );
  },
};

export const MarkAllRead: Story = {
  tags: ["interaction"],
  play: async ({ args }) => {
    const dialog = await screen.findByRole("dialog", {
      name: "Notifications",
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Mark all as read" }),
    );
    await expect(args.onMarkAllRead).toHaveBeenCalledTimes(1);
  },
};

export const ClickNotification: Story = {
  tags: ["interaction"],
  play: async ({ args }) => {
    const dialog = await screen.findByRole("dialog", {
      name: "Notifications",
    });
    const link = within(dialog).getByRole("link", { name: /New risk/ });
    const url = window.location.href;

    await userEvent.click(link);
    await expect(args.onNotificationClick).toHaveBeenCalledWith(
      notifications[1],
    );
    await expect(window.location.href).toBe(url);

    await userEvent.click(
      within(dialog).getByRole("button", { name: /Timesheet rejected/ }),
    );
    await expect(args.onNotificationClick).toHaveBeenLastCalledWith(
      notifications[2],
    );
  },
};
