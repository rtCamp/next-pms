import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import CalendarTimeline from "./CalendarTimeline.vue";
import visual, { CustomHeader, WithFilter } from "./CalendarTimeline.stories";

const meta = {
  ...visual,
  title: "Components/CalendarTimeline/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof CalendarTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NavigateRanges: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Oct 12 - Oct 25, 2026")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Next range" }));
    await waitFor(() =>
      expect(canvas.getByText("Oct 26 - Nov 8, 2026")).toBeVisible(),
    );
    await expect(args["onUpdate:rangeStart"]).toHaveBeenLastCalledWith(
      new Date(2026, 9, 26),
    );

    await userEvent.click(
      canvas.getByRole("button", { name: "Previous range" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Previous range" }),
    );
    await waitFor(() =>
      expect(canvas.getByText("Sep 28 - Oct 11, 2026")).toBeVisible(),
    );
  },
};

export const TodayGoesToThisWeek: Story = {
  args: { rangeStart: new Date(2026, 8, 28) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Today" }));
    await waitFor(() =>
      expect(canvas.getByText("Oct 12 - Oct 25, 2026")).toBeVisible(),
    );
    await expect(args["onUpdate:rangeStart"]).toHaveBeenLastCalledWith(
      new Date(2026, 9, 12),
    );
  },
};

export const PickedDateShowsItsWeek: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", {
      name: "Oct 12 - Oct 25, 2026",
    });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(
      await screen.findByRole("gridcell", { name: "2026-10-29" }),
    );
    await waitFor(() =>
      expect(canvas.getByText("Oct 26 - Nov 8, 2026")).toBeVisible(),
    );
    await expect(args["onUpdate:rangeStart"]).toHaveBeenLastCalledWith(
      new Date(2026, 9, 26),
    );
  },
};

export const EventsOnTheirDay: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("group")).toHaveLength(14);

    const wednesday = canvas.getByRole("group", {
      name: "Wednesday, October 14, 2026",
    });
    await expect(wednesday).toHaveAttribute("aria-current", "date");
    await expect(
      within(wednesday).getByText("Design sign-off"),
    ).toBeInTheDocument();
    await expect(
      within(wednesday).getByText("Sprint review"),
    ).toBeInTheDocument();

    const monday = canvas.getByRole("group", {
      name: "Monday, October 12, 2026",
    });
    await expect(monday).not.toHaveAttribute("aria-current");
    await expect(within(monday).getByText("Kick-off call")).toBeInTheDocument();
    await expect(within(monday).queryByText("Sprint review")).toBeNull();
  },
};

export const EventTooltip: Story = {
  play: async ({ canvasElement }) => {
    const title = within(canvasElement).getByText("Kick-off call");
    await userEvent.hover(title);
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "Kick-off call - Acme Website",
      ),
    );
  },
};

export const CustomHeaderReplacesNavigation: Story = {
  ...CustomHeader,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Milestones")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Today" })).toBeNull();
    await expect(canvas.queryByText("Oct 12 - Oct 25, 2026")).toBeNull();
  },
};

export const FilterSlotNextToNavigation: Story = {
  ...WithFilter,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "All projects" }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Today" })).toBeVisible();
  },
};
