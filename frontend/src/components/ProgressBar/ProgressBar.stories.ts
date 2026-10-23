import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ProgressBar from "./ProgressBar.vue";

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  args: { value: 40, maxValue: 100, size: "md" },
  argTypes: {
    value: { control: { type: "number", min: 0 } },
    secondaryValue: { control: { type: "number", min: 0 } },
    maxValue: { control: { type: "number", min: 0 } },
    markerValue: { control: { type: "number", min: 0 } },
    size: { control: "select", options: ["sm", "md", "lg"] },
    indicatorClass: { control: "text" },
    secondaryIndicatorClass: { control: "text" },
    markerClass: { control: "text" },
    label: { control: "text" },
  },
  render: (args) => ({
    components: { ProgressBar },
    setup: () => ({ args }),
    template: `
      <div class="w-80 p-4">
        <ProgressBar v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSecondaryValue: Story = {
  args: {
    value: 35,
    secondaryValue: 60,
    indicatorClass: "bg-surface-green-5",
    secondaryIndicatorClass: "bg-surface-green-3",
  },
};

export const WithMarker: Story = {
  args: { value: 55, markerValue: 70 },
};

export const HoursUsage: Story = {
  args: {
    value: 120,
    secondaryValue: 160,
    maxValue: 200,
    indicatorClass: "bg-surface-blue-5",
    secondaryIndicatorClass: "bg-surface-blue-2",
  },
};

export const InvoiceBurn: Story = {
  args: {
    value: 30000,
    secondaryValue: 45000,
    maxValue: 60000,
    indicatorClass: "bg-surface-violet-5",
    secondaryIndicatorClass: "bg-surface-blue-5",
  },
};

export const Small: Story = {
  args: { value: 60, secondaryValue: 80, markerValue: 50, size: "sm" },
};

export const Large: Story = {
  args: { value: 60, secondaryValue: 80, markerValue: 50, size: "lg" },
};
