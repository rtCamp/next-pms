import type { Meta, StoryObj } from "@storybook/vue3-vite";
import BudgetBurnBar from "./BudgetBurnBar.vue";
import { RICH_TOOLTIP_TEMPLATE, TOOLTIP_ARGS } from "./BudgetBurnBar.fixtures";

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
    label: { control: "text" },
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

export const Healthy: Story = {};

export const Moderate: Story = { args: { value: 35, secondaryValue: 15 } };

export const Over: Story = { args: { value: 55, secondaryValue: 10 } };

export const WithoutMarker: Story = {
  args: { value: 50, secondaryValue: 20, markerValue: 0 },
};

export const WithTooltips: Story = { args: TOOLTIP_ARGS };

export const RichTooltip: Story = {
  args: { value: 40, secondaryValue: 10 },
  render: (args) => ({
    components: { BudgetBurnBar },
    setup: () => ({ args }),
    template: RICH_TOOLTIP_TEMPLATE,
  }),
};

export const Small: Story = { args: { size: "sm" } };

export const Large: Story = { args: { size: "lg" } };
