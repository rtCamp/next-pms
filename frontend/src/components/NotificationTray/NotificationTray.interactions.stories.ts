import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "frappe-ui";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import NotificationTray from "./NotificationTray.vue";
import { NOTIFICATIONS } from "./NotificationTray.fixtures";

const meta = {
  title: "Components/NotificationTray/Interactions",
  component: NotificationTray,
  tags: ["interaction"],
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    notifications: NOTIFICATIONS,
    offsetClass: "left-60",
    "onUpdate:open": fn(),
    onMarkAllRead: fn(),
    onNotificationClick: fn(),
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { NotificationTray, Button },
      setup: () => ({
        args,
        setOpen: (open: boolean) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { open });
          updateArgs({ open });
        },
      }),
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
            @click="setOpen(true)"
          />
        </div>
        <NotificationTray v-bind="args" @update:open="setOpen" />
      `,
    };
  },
} satisfies Meta<typeof NotificationTray>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenAndClose: Story = {
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
  play: async ({ args }) => {
    await screen.findByRole("dialog", { name: "Notifications" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(args["onUpdate:open"]).toHaveBeenLastCalledWith(false);
  },
};

export const ShowsOnlyUnread: Story = {
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
  args: { notifications: NOTIFICATIONS.map((n) => ({ ...n, read: true })) },
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
  args: { notifications: [] },
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
  play: async ({ args }) => {
    const dialog = await screen.findByRole("dialog", {
      name: "Notifications",
    });
    const link = within(dialog).getByRole("link", { name: /New risk/ });
    const url = window.location.href;

    await userEvent.click(link);
    await expect(args.onNotificationClick).toHaveBeenCalledWith(
      NOTIFICATIONS[1],
    );
    await expect(window.location.href).toBe(url);

    await userEvent.click(
      within(dialog).getByRole("button", { name: /Timesheet rejected/ }),
    );
    await expect(args.onNotificationClick).toHaveBeenLastCalledWith(
      NOTIFICATIONS[2],
    );
  },
};
