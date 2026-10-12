import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Button } from "frappe-ui";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import BudgetBurnBar from "./BudgetBurnBar.vue";

const meta = {
  title: "Components/BudgetBurnBar",
  component: BudgetBurnBar,
  tags: ["autodocs"],
  args: {
    value: 30,
    secondaryValue: 15,
    markerValue: 70,
    maxValue: 100,
    size: "md",
  },
  argTypes: {
    value: { control: { type: "number", min: 0 } },
    secondaryValue: { control: { type: "number", min: 0 } },
    maxValue: { control: { type: "number", min: 0 } },
    markerValue: { control: { type: "number", min: 0 } },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  render: (args) => ({
    components: { BudgetBurnBar },
    setup: () => ({ args }),
    template: `
      <div class="w-80 p-4">
        <BudgetBurnBar v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof BudgetBurnBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const root = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("progressbar").parentElement!;
const hitArea = (canvasElement: HTMLElement, name: string) =>
  canvasElement.querySelector<HTMLElement>(`[data-segment="${name}"]`);
const expectTooltip = (text: string) =>
  waitFor(() =>
    expect(
      screen
        .getAllByRole("tooltip")
        .some((tip) => tip.textContent?.includes(text)),
    ).toBe(true),
  );

export const Healthy: Story = {};

export const Moderate: Story = { args: { value: 35, secondaryValue: 15 } };

export const Over: Story = { args: { value: 55, secondaryValue: 10 } };

export const WithoutMarker: Story = {
  args: { value: 50, secondaryValue: 20, markerValue: 0 },
};

export const WithTooltips: Story = {
  args: {
    value: 42000,
    secondaryValue: 12000,
    markerValue: 70000,
    maxValue: 100000,
    primaryTooltip: "Cost accrued",
    secondaryTooltip: "Cost forecasted",
    markerTooltip: "Target cost",
  },
};

export const RichTooltip: Story = {
  args: { value: 40, secondaryValue: 10 },
  render: (args) => ({
    components: { BudgetBurnBar },
    setup: () => ({ args }),
    template: `
      <div class="w-80 p-4">
        <BudgetBurnBar v-bind="args">
          <template #primary-tooltip>
            <div class="flex flex-col">
              <span class="font-semibold">Cost accrued</span>
              <span>₹40,000 of ₹1,00,000</span>
            </div>
          </template>
        </BudgetBurnBar>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: (args) => ({
    components: { BudgetBurnBar },
    setup: () => ({ args, sizes: ["sm", "md", "lg"] }),
    template: `
      <div class="flex w-80 flex-col gap-6 p-4">
        <BudgetBurnBar v-for="size in sizes" :key="size" v-bind="args" :size="size" />
      </div>
    `,
  }),
};

export const Tiers: Story = {
  args: { secondaryValue: 0, markerValue: 0 },
  render: (args) => ({
    components: { BudgetBurnBar },
    setup: () => ({ args, values: [20, 59, 60, 80, 81, 100] }),
    template: `
      <div class="flex w-80 flex-col gap-4 p-4 text-sm text-ink-gray-6">
        <div v-for="v in values" :key="v" class="flex items-center gap-3">
          <span class="w-10 shrink-0 text-right">{{ v }}%</span>
          <BudgetBurnBar v-bind="args" :value="v" :aria-label="v + '%'" />
        </div>
      </div>
    `,
  }),
};

export const TierBoundaries: Story = {
  ...Tiers,
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const bars = within(canvasElement).getAllByRole("progressbar");
    const tiers = bars.map((bar) => bar.parentElement!.dataset.tier);
    await expect(tiers).toEqual([
      "healthy",
      "healthy",
      "moderate",
      "moderate",
      "over",
      "over",
    ]);
  },
};

export const TierAgainstMarker: Story = {
  tags: ["interaction"],
  args: { value: 30, secondaryValue: 15, markerValue: 50, maxValue: 100 },
  play: async ({ canvasElement }) => {
    await expect(root(canvasElement).dataset.tier).toBe("over");
  },
};

export const SecondaryFollowsPrimary: Story = {
  tags: ["interaction"],
  args: { value: 30, secondaryValue: 15, maxValue: 60 },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", "30");
    await expect(bar).toHaveAttribute("aria-valuemax", "60");
    await expect(hitArea(canvasElement, "primary")?.style.width).toBe("50%");
    await expect(hitArea(canvasElement, "secondary")?.style.width).toBe("25%");
  },
};

export const SecondaryCappedAtBudget: Story = {
  tags: ["interaction"],
  args: { value: 80, secondaryValue: 50, markerValue: 0 },
  play: async ({ canvasElement }) => {
    await expect(hitArea(canvasElement, "primary")?.style.width).toBe("80%");
    await expect(hitArea(canvasElement, "secondary")?.style.width).toBe("20%");
  },
};

export const ShowsSegmentTooltips: Story = {
  ...WithTooltips,
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    await userEvent.hover(hitArea(canvasElement, "primary")!);
    await expectTooltip("Cost accrued");
    await userEvent.unhover(hitArea(canvasElement, "primary")!);

    await userEvent.hover(hitArea(canvasElement, "secondary")!);
    await expectTooltip("Cost forecasted");
    await userEvent.unhover(hitArea(canvasElement, "secondary")!);

    await userEvent.hover(hitArea(canvasElement, "marker")!);
    await expectTooltip("Target cost");
    await userEvent.unhover(hitArea(canvasElement, "marker")!);
  },
};

export const ShowsRichTooltip: Story = {
  ...RichTooltip,
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    await userEvent.hover(hitArea(canvasElement, "primary")!);
    await expectTooltip("₹40,000 of ₹1,00,000");
    await userEvent.unhover(hitArea(canvasElement, "primary")!);
  },
};

export const NoMarkerWithoutValue: Story = {
  ...WithoutMarker,
  tags: ["interaction"],
  args: { ...WithoutMarker.args, markerTooltip: "Target" },
  play: async ({ canvasElement }) => {
    await expect(hitArea(canvasElement, "marker")).toBeNull();
  },
};

export const FollowsSpend: Story = {
  tags: ["interaction"],
  args: { value: 40, secondaryValue: 0, markerValue: 0 },
  render: (args) => ({
    components: { BudgetBurnBar, Button },
    setup: () => ({ args, value: ref(args.value) }),
    template: `
      <div class="flex w-80 flex-col gap-4 p-4">
        <BudgetBurnBar v-bind="args" :value="value" />
        <Button label="Spend 25" @click="value += 25" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(root(canvasElement).dataset.tier).toBe("healthy");

    await userEvent.click(canvas.getByRole("button", { name: "Spend 25" }));
    await waitFor(() =>
      expect(root(canvasElement).dataset.tier).toBe("moderate"),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Spend 25" }));
    await waitFor(() => expect(root(canvasElement).dataset.tier).toBe("over"));
    await expect(canvas.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "90",
    );
  },
};
