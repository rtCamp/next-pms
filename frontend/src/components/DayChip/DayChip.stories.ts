import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import DayChip from "./DayChip.vue";
import type { DayChipState } from "./types";

const STATES: DayChipState[] = [
  "default",
  "active",
  "selected",
  "disabled",
  "skeleton",
];

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

export const AllStates: Story = {
  render: () => ({
    components: { DayChip },
    setup: () => ({ states: STATES }),
    template: `
      <div class="flex gap-2 p-2">
        <div v-for="(state, i) in states" :key="state" class="flex flex-col items-center gap-3">
          <DayChip :state="state" day-label="Tue" :day-number="13 + i" month-label="Oct" is-month-boundary />
          <span class="text-xs text-ink-gray-5">{{ state }}</span>
        </div>
      </div>
    `,
  }),
};

const DAYS = [
  { date: "2026-10-29", dayLabel: "Thu", dayNumber: 29 },
  { date: "2026-10-30", dayLabel: "Fri", dayNumber: 30 },
  {
    date: "2026-10-31",
    dayLabel: "Sat",
    dayNumber: 31,
    isLocked: true,
    tooltip: "Weekly off",
  },
  {
    date: "2026-11-01",
    dayLabel: "Sun",
    dayNumber: 1,
    monthLabel: "Nov",
    isMonthBoundary: true,
  },
  { date: "2026-11-02", dayLabel: "Mon", dayNumber: 2 },
];

export const DayStrip: Story = {
  render: () => ({
    components: { DayChip },
    setup() {
      const selected = ref(new Set(["2026-10-30"]));
      function toggle(date: string) {
        const next = new Set(selected.value);
        if (next.has(date)) next.delete(date);
        else next.add(date);
        selected.value = next;
      }
      return { days: DAYS, selected, toggle };
    },
    template: `
      <div class="flex gap-1 py-1.5">
        <DayChip
          v-for="day in days"
          :key="day.date"
          :day-label="day.dayLabel"
          :day-number="day.dayNumber"
          :month-label="day.monthLabel"
          :is-month-boundary="day.isMonthBoundary"
          :tooltip="day.tooltip"
          :state="day.isLocked ? 'disabled' : selected.has(day.date) ? 'active' : 'default'"
          @click="toggle(day.date)"
        />
      </div>
    `,
  }),
};

export const EmitsClick: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const chip = within(canvasElement).getByRole("button", { name: "Mon 12" });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await expect(chip).toHaveAttribute("aria-disabled", "false");
    await userEvent.click(chip);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DisabledIgnoresClick: Story = {
  tags: ["interaction"],
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const chip = within(canvasElement).getByRole("button", { name: "Mon 12" });
    await expect(chip).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(chip);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const SkeletonIsInert: Story = {
  tags: ["interaction"],
  args: { state: "skeleton" },
  play: async ({ canvasElement, args }) => {
    const chip = within(canvasElement).getByRole("button");
    await expect(chip).toHaveAttribute("aria-disabled", "true");
    await expect(chip).toHaveAttribute("tabindex", "-1");
    await userEvent.click(chip);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const ShowsTooltip: Story = {
  tags: ["interaction"],
  args: { state: "disabled", tooltip: "Holiday: Diwali" },
  play: async ({ canvasElement }) => {
    await userEvent.hover(
      within(canvasElement).getByRole("button", { name: "Mon 12" }),
    );
    await expect(
      await screen.findByRole("tooltip", {}, { timeout: 2000 }),
    ).toHaveTextContent("Holiday: Diwali");
  },
};

export const ToggleDaysInStrip: Story = {
  ...DayStrip,
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fri = canvas.getByRole("button", { name: "Fri 30" });
    const mon = canvas.getByRole("button", { name: "Mon 2" });
    const sat = canvas.getByRole("button", { name: "Sat 31" });
    await expect(fri).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvas.getByRole("button", { name: "Sun 1 Nov" }),
    ).toBeVisible();

    await userEvent.click(mon);
    await waitFor(() => expect(mon).toHaveAttribute("aria-pressed", "true"));

    await userEvent.click(fri);
    await waitFor(() => expect(fri).toHaveAttribute("aria-pressed", "false"));

    await userEvent.click(sat);
    await expect(sat).toHaveAttribute("aria-pressed", "false");
    await expect(sat).toHaveAttribute("aria-disabled", "true");
  },
};
