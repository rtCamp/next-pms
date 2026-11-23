import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import MotionDialogPlayer from "./MotionDialogPlayer.vue";
import visual from "./MotionDialogPlayer.stories";
import { SUBMIT_WEEK_TITLE, loadSubmitWeek } from "./MotionPlayer.fixtures";

const meta = {
  title: "Components/MotionPlayer/MotionDialogPlayer/Interactions",
  component: MotionDialogPlayer,
  tags: ["interaction"],
  args: { motion: loadSubmitWeek, title: SUBMIT_WEEK_TITLE },
  render: visual.render,
} satisfies Meta<typeof MotionDialogPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

const nextFrames = async (count: number) => {
  for (let i = 0; i < count; i++)
    await new Promise((resolve) => requestAnimationFrame(resolve));
};

export const EnlargesInADialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Enlarge animation" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: SUBMIT_WEEK_TITLE,
    });
    const picture = within(dialog).getByRole("img", {
      name: SUBMIT_WEEK_TITLE,
    });
    await waitFor(() => expect(picture).toBeVisible());
    await expect(
      within(dialog).getByRole("button", { name: "Shrink animation" }),
    ).toBeInTheDocument();
  },
};

export const PausesTheInlinePlayerWhileEnlarged: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inline = await canvas.findByRole("slider", {
      name: "Animation progress",
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Enlarge animation" }),
    );
    await screen.findByRole("dialog", { name: SUBMIT_WEEK_TITLE });

    const pausedAt = inline.getAttribute("aria-valuenow");
    await nextFrames(10);
    await expect(inline).toHaveAttribute("aria-valuenow", pausedAt);
  },
};

export const ShrinksBack: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Enlarge animation" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: SUBMIT_WEEK_TITLE,
    });

    await userEvent.click(
      await within(dialog).findByRole("button", { name: "Shrink animation" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const ClosesWithEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Enlarge animation" }),
    );
    await screen.findByRole("dialog", { name: SUBMIT_WEEK_TITLE });

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};
