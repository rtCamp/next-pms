import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "frappe-ui";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import NotificationTray from "./NotificationTray.vue";
import {
  ITEM_TOOLTIP,
  MANY_NOTIFICATIONS,
  NOTIFICATIONS,
  TRAY_HELP,
} from "./NotificationTray.fixtures";

const meta = {
  title: "Components/NotificationTray",
  component: NotificationTray,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed, modal panels: inline on the docs page they stack and lock scrolling.
    docs: { story: { inline: false, height: "600px" } },
  },
  args: {
    open: false,
    notifications: NOTIFICATIONS,
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

export const Closed: Story = {};

export const Open: Story = { args: { open: true } };

export const Empty: Story = { args: { open: true, notifications: [] } };

export const AllRead: Story = {
  args: {
    open: true,
    notifications: NOTIFICATIONS.map((n) => ({ ...n, read: true })),
  },
};

export const ManyNotifications: Story = {
  args: { open: true, notifications: MANY_NOTIFICATIONS },
};

export const CollapsedSidebar: Story = {
  args: { open: true, offsetClass: "left-12" },
};

/** An info card after the title and a tooltip on each notification. */
export const WithHelp: Story = {
  args: { open: true, help: TRAY_HELP, itemTooltip: ITEM_TOOLTIP },
};
