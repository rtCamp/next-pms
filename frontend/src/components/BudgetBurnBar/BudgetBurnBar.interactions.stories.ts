import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { Button } from "frappe-ui";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import BudgetBurnBar from "./BudgetBurnBar.vue";
import { RICH_TOOLTIP_TEMPLATE, TOOLTIP_ARGS } from "./BudgetBurnBar.fixtures";

const meta = {
  title: "Components/BudgetBurnBar/Interactions",
  component: BudgetBurnBar,
  tags: ["interaction"],
  args: {
    value: 30,
    secondaryValue: 15,
    markerValue: 70,
    maxValue: 100,
    size: "md",
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

export const TierBoundaries: Story = {
  args: { secondaryValue: 0, markerValue: 0 },
  render: (args) => ({
    components: { BudgetBurnBar },
    setup: () => ({ args, values: [20, 59, 60, 80, 81, 100] }),
    template: `
      <div class="flex w-80 flex-col gap-4 p-4">
        <BudgetBurnBar v-for="v in values" :key="v" v-bind="args" :value="v" :label="v + '%'" />
      </div>
    `,
  }),
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
  args: { value: 30, secondaryValue: 15, markerValue: 50, maxValue: 100 },
  play: async ({ canvasElement }) => {
    await expect(root(canvasElement).dataset.tier).toBe("over");
  },
};

export const NamedByLabel: Story = {
  args: { label: "Project budget" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("progressbar", {
        name: "Project budget",
      }),
    ).toBeInTheDocument();
  },
};

export const SecondaryFollowsPrimary: Story = {
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
  args: { value: 80, secondaryValue: 50, markerValue: 0 },
  play: async ({ canvasElement }) => {
    await expect(hitArea(canvasElement, "primary")?.style.width).toBe("80%");
    await expect(hitArea(canvasElement, "secondary")?.style.width).toBe("20%");
  },
};

export const ShowsSegmentTooltips: Story = {
  args: TOOLTIP_ARGS,
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
  args: { value: 40, secondaryValue: 10 },
  render: (args) => ({
    components: { BudgetBurnBar },
    setup: () => ({ args }),
    template: RICH_TOOLTIP_TEMPLATE,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.hover(hitArea(canvasElement, "primary")!);
    await expectTooltip("₹40,000 of ₹1,00,000");
    await userEvent.unhover(hitArea(canvasElement, "primary")!);
  },
};

export const NoMarkerWithoutValue: Story = {
  args: {
    value: 50,
    secondaryValue: 20,
    markerValue: 0,
    markerTooltip: "Target",
  },
  play: async ({ canvasElement }) => {
    await expect(hitArea(canvasElement, "marker")).toBeNull();
  },
};

export const FollowsSpend: Story = {
  args: { value: 40, secondaryValue: 0, markerValue: 0 },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { BudgetBurnBar, Button },
      setup: () => ({
        args,
        spend: (amount: number) => {
          const value = (args.value ?? 0) + amount;
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { value });
          updateArgs({ value });
        },
      }),
      template: `
        <div class="flex w-80 flex-col gap-4 p-4">
          <BudgetBurnBar v-bind="args" />
          <Button label="Spend 25" @click="spend(25)" />
        </div>
      `,
    };
  },
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
