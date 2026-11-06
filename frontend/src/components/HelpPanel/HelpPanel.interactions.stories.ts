import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { SidebarItem } from "frappe-ui";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { WIKI_BASE } from "@/components/InfoHoverCard";
import HelpPanel from "./HelpPanel.vue";
import { GENERAL_TIPS, MOTION_TIP, PAGE_TIPS } from "./HelpPanel.fixtures";

const meta = {
  title: "Components/HelpPanel/Interactions",
  component: HelpPanel,
  tags: ["interaction"],
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
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
          class="fixed inset-y-0 left-0 flex w-60 flex-col justify-between border-r border-outline-gray-1 bg-surface-sidebar p-2"
        >
          <p class="text-sm text-ink-gray-7">Page content</p>
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

const panel = () => screen.findByRole("dialog", { name: "Help" });

export const OpenAndClose: Story = {
  args: { open: false },
  play: async ({ args, canvas }) => {
    const help = canvas.getByRole("button", { name: "Help" });
    await expect(help).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(help);
    await waitFor(async () => expect(await panel()).toBeVisible());
    await expect(help).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: "Close help" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(args["onUpdate:open"]).toHaveBeenLastCalledWith(false);
  },
};

/** The panel isn't modal: using the page leaves it open, and Help closes it again. */
export const StaysOpenWhileThePageIsUsed: Story = {
  play: async ({ canvas }) => {
    await panel();
    await userEvent.click(canvas.getByText("Page content"));
    await expect(await panel()).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Help" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const ClosesOnEscape: Story = {
  play: async () => {
    await expect(await panel()).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/** Opening a tip shows its body, steps and wiki link, and closes the tip open before it. */
export const ExpandsOneTipAtATime: Story = {
  play: async () => {
    const dialog = within(await panel());
    const addTime = dialog.getByRole("button", { name: "Add time to a task" });
    await expect(addTime).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(addTime);
    await expect(addTime).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(
        dialog.getByText("Add hours to a task from the Add time dialog."),
      ).toBeVisible(),
    );
    const steps = dialog.getAllByRole("listitem");
    await expect(steps.map((step) => step.textContent)).toEqual(
      PAGE_TIPS[0].steps,
    );
    await expect(
      dialog.getByRole("link", { name: "Learn more in the wiki" }),
    ).toHaveAttribute(
      "href",
      `${WIKI_BASE}/Personal-Timesheet#log-time-with-the-add-time-dialog`,
    );

    const search = dialog.getByRole("button", {
      name: "Jump anywhere with search",
    });
    await userEvent.click(search);
    await expect(search).toHaveAttribute("aria-expanded", "true");
    await expect(addTime).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(search);
    await expect(search).toHaveAttribute("aria-expanded", "false");
  },
};

/** Tips limited to some roles are hidden from everyone else. */
export const FiltersTipsByRole: Story = {
  play: async () => {
    const pageGroup = within(
      within(await panel()).getByRole("group", { name: "On this page" }),
    );
    await expect(
      pageGroup.getAllByRole("button").map((tip) => tip.textContent?.trim()),
    ).toEqual(["Add time to a task", "Open Add time on a chosen day"]);
    await expect(
      pageGroup.queryByRole("button", { name: "Review a member's timesheet" }),
    ).toBeNull();
  },
};

export const ShowsRoleTipsToTheirRoles: Story = {
  args: { roles: ["Timesheet Manager"] },
  play: async () => {
    const pageGroup = within(
      within(await panel()).getByRole("group", { name: "On this page" }),
    );
    await expect(
      pageGroup.getByRole("button", { name: "Review a member's timesheet" }),
    ).toBeInTheDocument();
  },
};

/** A page without tips says so, and the tips for every page still show. */
export const PageWithoutTips: Story = {
  args: { pageTips: [] },
  play: async () => {
    const dialog = within(await panel());
    await expect(
      dialog.getByText("No tips for this page yet."),
    ).toBeInTheDocument();
    await expect(
      dialog.queryByRole("group", { name: "On this page" }),
    ).toBeNull();
    await expect(
      dialog.getByRole("group", { name: "Everywhere" }),
    ).toBeInTheDocument();
  },
};

/** A tip with a motion shows the play icon and plays the motion under its text when opened. */
export const PlaysATipsMotion: Story = {
  args: { pageTips: [MOTION_TIP, ...PAGE_TIPS] },
  play: async () => {
    const help = within(await panel());
    await userEvent.click(
      help.getByRole("button", { name: "Send a week for approval" }),
    );
    await help.findByRole("slider", { name: "Animation progress" });
    await waitFor(() =>
      expect(
        help.getByRole("img", { name: "Send a week for approval" }),
      ).toHaveAttribute("data-motion", "submit-week"),
    );
  },
};
