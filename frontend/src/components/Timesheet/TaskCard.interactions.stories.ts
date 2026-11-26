import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import TaskCard from "./TaskCard.vue";
import visual from "./TaskCard.stories";

const meta = {
  ...visual,
  title: "Components/Timesheet/TaskCard/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof TaskCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShowsTaskSummary: Story = {
  play: async ({ canvasElement }) => {
    const card = within(canvasElement);
    await expect(card.getByText("UI Responsiveness Testing")).toBeVisible();
    await expect(
      card.getByRole("img", { name: "Working" }),
    ).toBeInTheDocument();
    await expect(card.getByText("Blue Harbour CMS Migration")).toBeVisible();
    await expect(card.getByText("30 Oct")).toBeVisible();
    await expect(card.getByText("09:45")).toBeVisible();
    await expect(card.getByText("12:00")).toBeVisible();
    await expect(card.getByText("81%")).toBeVisible();
    await expect(
      card.getByRole("progressbar", { name: "Actual against estimated time" }),
    ).toHaveAttribute("aria-valuenow", "81");
  },
};

export const ShowsOverEstimate: Story = {
  args: { actualHours: 15, estimatedHours: 12 },
  play: async ({ canvasElement }) => {
    const card = within(canvasElement);
    await expect(card.getByText("125%")).toBeVisible();
    await expect(
      card.getByRole("progressbar", { name: "Actual against estimated time" }),
    ).toHaveAttribute("aria-valuetext", "125%");
  },
};

export const NoEstimateShowsZero: Story = {
  args: { estimatedHours: 0 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("0%")).toBeVisible();
  },
};
