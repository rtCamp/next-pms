import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import DayChip from "./DayChip.vue";
import { STATES } from "./DayChip.fixtures";

const meta = {
  title: "Components/DayChip",
  component: DayChip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    dayLabel: "Mon",
    dayNumber: 12,
    state: "default",
    onClick: fn(),
  },
  argTypes: {
    state: { control: "select", options: STATES },
  },
  render: (args) => ({
    components: { DayChip },
    setup: () => ({ args }),
    template: `<div class="p-2"><DayChip v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof DayChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { state: "active" } };
export const Selected: Story = { args: { state: "selected" } };
export const Disabled: Story = { args: { state: "disabled" } };
export const Skeleton: Story = { args: { state: "skeleton" } };

export const MonthBoundary: Story = {
  args: {
    dayLabel: "Sat",
    dayNumber: 1,
    monthLabel: "Nov",
    isMonthBoundary: true,
  },
};

export const WithTooltip: Story = {
  args: { state: "disabled", tooltip: "Holiday: Diwali" },
};
