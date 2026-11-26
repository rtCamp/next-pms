import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { useWhatsNew } from "@/composables/useWhatsNew";
import WhatsNew from "./WhatsNew.vue";
import { fakeWhatsNewServer, markedSeen } from "./WhatsNew.fixtures";
import meta, { Default, Empty } from "./WhatsNew.stories";

export default {
  ...meta,
  title: "Pages/WhatsNew/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof WhatsNew>;
type Story = StoryObj<typeof meta>;

/** The page lists the releases under the installed version and takes focus on its title. */
export const ListsReleases: Story = {
  ...Default,
  play: async ({ canvas }) => {
    const title = canvas.getByRole("heading", { level: 1, name: "What's new" });
    await expect(title).toHaveFocus();
    await expect(await canvas.findByText("You're on v2.14.1")).toBeVisible();
    const releases = canvas.getAllByRole("region", { name: /^v\d/ });
    await expect(releases).toHaveLength(2);
    await expect(releases[0]).toBe(
      canvas.getByRole("region", { name: "v2.14.0" }),
    );
    await expect(releases[1]).toBe(
      canvas.getByRole("region", { name: "v2.13.0" }),
    );
    await expect(
      canvas.getByRole("button", { name: /v2\.13\.0/ }),
    ).toHaveAttribute("aria-expanded", "false");
  },
};

/** Showing a newer release than the last seen one records it, then clears the dots. */
export const MarksLatestSeen: Story = {
  ...Default,
  play: async ({ canvas }) => {
    await canvas.findByRole("region", { name: "v2.14.0" });
    const whatsNew = useWhatsNew();
    await waitFor(() => expect(whatsNew.unseen).toBe(false));
    await expect(markedSeen).toEqual(["2.14.0"]);
    await expect(whatsNew.lastSeen).toBe("2.14.0");
  },
};

/** A release the user has already seen isn't recorded again. */
export const SkipsSeenRelease: Story = {
  ...Default,
  beforeEach: () => {
    useWhatsNew().lastSeen = "2.14.0";
  },
  play: async ({ canvas }) => {
    await canvas.findByRole("region", { name: "v2.14.0" });
    await expect(markedSeen).toEqual([]);
  },
};

/** Without releases the page says so and records nothing. */
export const ShowsEmpty: Story = {
  ...Empty,
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No release notes yet")).toBeVisible();
    await expect(markedSeen).toEqual([]);
    await expect(useWhatsNew().unseen).toBe(true);
  },
};

/** A failed load shows an alert whose Retry loads the notes. */
export const RetriesAfterError: Story = {
  beforeEach: () => fakeWhatsNewServer({ failures: 1 }),
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Couldn't load release notes."),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(
      await canvas.findByRole("region", { name: "v2.14.0" }),
    ).toBeVisible();
    await expect(canvas.queryByText("Couldn't load release notes.")).toBeNull();
  },
};
