import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent } from "storybook/test";
import ReleaseCard from "./ReleaseCard.vue";
import meta, { Latest, Older } from "./ReleaseCard.stories";

export default {
  ...meta,
  title: "Pages/WhatsNew/ReleaseCard/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof ReleaseCard>;
type Story = StoryObj<typeof meta>;

/** The latest release shows its notes, the badge and its date, and has no toggle. */
export const LatestIsOpen: Story = {
  ...Latest,
  play: async ({ canvas }) => {
    const card = canvas.getByRole("region", { name: "v2.14.0" });
    await expect(card).toHaveTextContent("Latest");
    await expect(card).toHaveTextContent("12 Nov 2026");
    await expect(canvas.queryByRole("button")).toBeNull();
    await expect(
      canvas.getByRole("heading", { level: 3, name: "New features" }),
    ).toBeVisible();
  },
};

/** An older release opens and closes from its header button. */
export const OlderToggles: Story = {
  ...Older,
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("button", { name: /v2\.13\.0/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText("Improvements")).toBeNull();
    await expect(canvas.queryByText("Latest")).toBeNull();

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      canvas.getByRole("heading", { level: 3, name: "Improvements" }),
    ).toBeVisible();

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText("Improvements")).toBeNull();
  },
};
