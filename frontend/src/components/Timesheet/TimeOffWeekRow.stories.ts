import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TimeOffWeekRow from "./TimeOffWeekRow.vue";
import {
  HOLIDAYS,
  LEAVES,
  WEEKEND_ONLY,
  WEEK_DATES,
} from "./WeekGroup.fixtures";

const meta = {
  title: "Components/Timesheet/TimeOffWeekRow",
  component: TimeOffWeekRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    dates: WEEK_DATES,
    leaves: LEAVES,
    holidays: HOLIDAYS,
    dailyHours: 8,
  },
  render: (args) => ({
    components: { TimeOffWeekRow },
    setup: () => ({ args }),
    template: `<TimeOffWeekRow v-bind="args" />`,
  }),
} satisfies Meta<typeof TimeOffWeekRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LeaveAndHoliday: Story = {};

export const OnlyWeeklyOffs: Story = {
  args: { leaves: [], holidays: WEEKEND_ONLY },
};
