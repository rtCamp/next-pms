import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { SidebarItem } from "frappe-ui";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import HelpPanel from "./HelpPanel.vue";
import { GENERAL_TIPS, MANY_TIPS, PAGE_TIPS } from "./HelpPanel.fixtures";

const meta = {
  title: "Components/HelpPanel",
  component: HelpPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed panels: inline on the docs page they stack on each other.
    docs: { story: { inline: false, height: "640px" } },
  },
  args: {
    open: false,
    pageTips: PAGE_TIPS,
    generalTips: GENERAL_TIPS,
    roles: [],
    "onUpdate:open": fn(),
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { HelpPanel, SidebarItem },
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
          class="fixed inset-y-0 left-0 flex w-60 flex-col justify-end border-r border-outline-gray-1 bg-surface-sidebar p-2"
        >
          <SidebarItem
            label="Help"
            icon="lucide-circle-help"
            :active="args.open"
            :aria-expanded="args.open"
            @click="setOpen(!args.open)"
          />
        </div>
        <HelpPanel v-bind="args" class="left-60" @update:open="setOpen" />
      `,
    };
  },
} satisfies Meta<typeof HelpPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = { args: { open: true } };

/** Tips limited to a role show once the user holds it. */
export const WithRoleTips: Story = {
  args: { open: true, roles: ["Timesheet Manager"] },
};

export const NoPageTips: Story = { args: { open: true, pageTips: [] } };

/** The list scrolls inside the panel when it is taller than the window. */
export const ManyTips: Story = { args: { open: true, pageTips: MANY_TIPS } };
