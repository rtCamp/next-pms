import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import DayChip from "./DayChip.vue";
import { DAYS } from "./DayChip.fixtures";

const meta = {
  title: "Components/DayChip/Interactions",
  component: DayChip,
  tags: ["interaction"],
  args: {
    dayLabel: "Mon",
    dayNumber: 12,
    state: "default",
    onClick: fn(),
  },
  render: (args) => ({
    components: { DayChip },
    setup: () => ({ args }),
    template: `<div class="p-2"><DayChip v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof DayChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmitsClick: Story = {
  play: async ({ canvasElement, args }) => {
    const chip = within(canvasElement).getByRole("button", { name: "Mon 12" });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await expect(chip).toHaveAttribute("aria-disabled", "false");
    await userEvent.click(chip);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DisabledIgnoresClick: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const chip = within(canvasElement).getByRole("button", { name: "Mon 12" });
    await expect(chip).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(chip);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const SkeletonIsInert: Story = {
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
