import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, waitFor, within } from "storybook/test";
import LoadMoreRow from "./LoadMoreRow.vue";
import visual from "./LoadMoreRow.stories";

const meta = {
  ...visual,
  title: "Components/Timesheet/LoadMoreRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof LoadMoreRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadsWhenInView: Story = {
  args: { hasMore: true },
  play: async ({ canvasElement, args }) => {
    await expect(
      within(canvasElement).getByRole("status", { name: "Loading more" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(args.onLoadMore).toHaveBeenCalledTimes(1));
  },
};

export const WaitsWhileLoading: Story = {
  args: { hasMore: true, loading: true },
  play: async ({ canvasElement, args }) => {
    await expect(
      within(canvasElement).getByRole("status", { name: "Loading more" }),
    ).toBeInTheDocument();
    await expect(args.onLoadMore).not.toHaveBeenCalled();
  },
};

export const EmptyShowsText: Story = {
  args: { empty: true, emptyText: "No timesheet for this week" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("No timesheet for this week"),
    ).toBeVisible();
  },
};

export const NothingWhenDone: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent?.trim()).toBe("");
  },
};
