import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import TimeOffWeekRow from "./TimeOffWeekRow.vue";
import visual from "./TimeOffWeekRow.stories";
import { HOLIDAYS, WEEKEND_ONLY } from "./WeekGroup.fixtures";

const meta = {
  ...visual,
  title: "Components/Timesheet/TimeOffWeekRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof TimeOffWeekRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HalfDayAndHolidayHours: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("04:00")).toBeVisible();
    await expect(canvas.getByText("08:00")).toBeVisible();
    await expect(canvas.getByText("12:00")).toBeVisible();
    await expect(canvas.getByText("New Year's Day")).toBeInTheDocument();
  },
};

export const LeaveOnHolidayCountsOnce: Story = {
  args: {
    leaves: [
      {
        name: "HR-LAP-002",
        from_date: HOLIDAYS[0].holiday_date,
        to_date: HOLIDAYS[0].holiday_date,
        status: "Approved",
        half_day: false,
        half_day_date: "",
        leave_type: "Casual Leave",
        is_lwp: false,
        includes_holidays: true,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("08:00")).toHaveLength(2);
  },
};

export const HiddenWithOnlyWeeklyOffs: Story = {
  args: { leaves: [], holidays: WEEKEND_ONLY },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText("Time-off")).toBeNull();
  },
};
