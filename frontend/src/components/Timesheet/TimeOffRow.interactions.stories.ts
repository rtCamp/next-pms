import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import TimeOffRow from "./TimeOffRow.vue";
import visual, { WithHelp } from "./TimeOffRow.stories";

const meta = {
  ...visual,
  title: "Components/Timesheet/TimeOffRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof TimeOffRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShowsHoursAndTotal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Time-off")).toBeVisible();
    await expect(canvas.getAllByText("08:00")).toHaveLength(2);
    await expect(canvas.getByText("16:00")).toBeVisible();
  },
};

export const EmptyDaysShowDash: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText("-")).toHaveLength(5);
  },
};

export const HolidayTooltip: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Christmas")).toBeInTheDocument();
    const [, holiday] = canvas.getAllByText("08:00");
    await userEvent.hover(holiday);
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent("Christmas"),
    );
  },
};

export const HelpCardBesideLabel: Story = {
  args: WithHelp.args,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "About Time-off" }),
    ).toBeVisible();
  },
};
