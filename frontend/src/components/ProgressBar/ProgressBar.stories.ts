import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
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

const bar = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("progressbar");
const part = (canvasElement: HTMLElement, name: string) =>
  bar(canvasElement).querySelector<HTMLElement>(`[data-part="${name}"]`);

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

export const Sizes: Story = {
  args: { value: 60, secondaryValue: 80, markerValue: 50 },
  render: (args) => ({
    components: { ProgressBar },
    setup: () => ({ args, sizes: ["sm", "md", "lg"] }),
    template: `
      <div class="flex w-80 flex-col gap-4 p-4">
        <ProgressBar v-for="size in sizes" :key="size" v-bind="args" :size="size" />
      </div>
    `,
  }),
};

export const ReportsClampedValue: Story = {
  tags: ["interaction"],
  args: { value: 150, maxValue: 120 },
  play: async ({ canvasElement }) => {
    const progressbar = bar(canvasElement);
    await expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    await expect(progressbar).toHaveAttribute("aria-valuemax", "120");
    await expect(progressbar).toHaveAttribute("aria-valuenow", "120");
    await expect(part(canvasElement, "primary")?.style.width).toBe("100%");
  },
};

export const ScalesToMaxValue: Story = {
  tags: ["interaction"],
  args: { value: 50, secondaryValue: 150, maxValue: 200 },
  play: async ({ canvasElement }) => {
    await expect(part(canvasElement, "primary")?.style.width).toBe("25%");
    await expect(part(canvasElement, "secondary")?.style.width).toBe("75%");
  },
};

export const LongerFillSitsBehind: Story = {
  tags: ["interaction"],
  args: { value: 30, secondaryValue: 70 },
  play: async ({ canvasElement }) => {
    const parts = Array.from(
      bar(canvasElement).querySelectorAll("[data-part]"),
      (el) => el.getAttribute("data-part"),
    );
    await expect(parts).toEqual(["secondary", "primary"]);
  },
};

export const ShorterSecondarySitsOnTop: Story = {
  tags: ["interaction"],
  args: { value: 70, secondaryValue: 30 },
  play: async ({ canvasElement }) => {
    const parts = Array.from(
      bar(canvasElement).querySelectorAll("[data-part]"),
      (el) => el.getAttribute("data-part"),
    );
    await expect(parts).toEqual(["primary", "secondary"]);
  },
};

export const MarkerOnlyInsideRange: Story = {
  tags: ["interaction"],
  args: { value: 40, markerValue: 25 },
  render: (args) => ({
    components: { ProgressBar },
    setup: () => ({ args }),
    template: `
      <div class="flex w-80 flex-col gap-4 p-4">
        <ProgressBar v-bind="args" aria-label="Inside" />
        <ProgressBar v-bind="args" :marker-value="0" aria-label="At zero" />
        <ProgressBar v-bind="args" :marker-value="100" aria-label="At max" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const marker = (name: string) =>
      canvas
        .getByRole("progressbar", { name })
        .querySelector<HTMLElement>('[data-part="marker"]');
    await expect(marker("Inside")?.style.left).toBe("25%");
    await expect(marker("At zero")).toBeNull();
    await expect(marker("At max")).toBeNull();
  },
};

export const EmptyWhenMaxIsZero: Story = {
  tags: ["interaction"],
  args: { value: 10, maxValue: 0 },
  play: async ({ canvasElement }) => {
    await expect(bar(canvasElement)).toHaveAttribute("aria-valuenow", "0");
    await expect(part(canvasElement, "primary")?.style.width).toBe("0%");
  },
};

export const FollowsValue: Story = {
  tags: ["interaction"],
  args: { value: 20 },
  render: (args) => ({
    components: { ProgressBar, Button },
    setup: () => ({ args, value: ref(args.value) }),
    template: `
      <div class="flex w-80 flex-col gap-4 p-4">
        <ProgressBar v-bind="args" :value="value" />
        <Button label="Log 30" @click="value += 30" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const progressbar = canvas.getByRole("progressbar");
    await expect(progressbar).toHaveAttribute("aria-valuenow", "20");

    await userEvent.click(canvas.getByRole("button", { name: "Log 30" }));
    await waitFor(() =>
      expect(progressbar).toHaveAttribute("aria-valuenow", "50"),
    );
    await expect(part(canvasElement, "primary")?.style.width).toBe("50%");
  },
};
