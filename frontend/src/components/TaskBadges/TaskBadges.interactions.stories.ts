import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import TaskBadges from "./TaskBadges.vue";
import visual from "./TaskBadges.stories";

const meta = {
  ...visual,
  title: "Components/TaskBadges/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof TaskBadges>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormatsDueDate: Story = {
  play: async ({ canvasElement }) => {
    const badges = within(canvasElement);
    await expect(
      badges.getByRole("img", { name: "Due date" }),
    ).toBeInTheDocument();
    await expect(badges.getByText("30 Oct")).toBeVisible();
  },
};

export const ShowsProject: Story = {
  play: async ({ canvasElement }) => {
    const badges = within(canvasElement);
    await expect(
      badges.getByRole("img", { name: "Project" }),
    ).toBeInTheDocument();
    await expect(
      badges.getByText("Blue Harbour CMS Migration"),
    ).toHaveAttribute("title", "Blue Harbour CMS Migration");
  },
};

export const RendersNothingWithoutData: Story = {
  args: { projectName: undefined, dueDate: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("img")).toBeNull();
    await expect(within(canvasElement).queryByText(/\S/)).toBeNull();
  },
};
