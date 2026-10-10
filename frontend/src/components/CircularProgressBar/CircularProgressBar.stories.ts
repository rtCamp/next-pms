import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import CircularProgressBar from "./CircularProgressBar.vue";

const meta = {
  title: "Components/CircularProgressBar",
  component: CircularProgressBar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { step: 1, totalSteps: 4 },
  argTypes: {
    step: { control: { type: "number", min: 0 } },
    totalSteps: { control: { type: "number", min: 1 } },
    theme: {
      control: "select",
      options: ["black", "red", "green", "blue", "orange"],
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    themeComplete: { control: "text" },
    variant: { control: "select", options: ["solid", "outline"] },
  },
  render: (args) => ({
    components: { CircularProgressBar },
    setup: () => ({ args }),
    template: `
      <div class="flex items-center justify-center p-4">
        <CircularProgressBar v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof CircularProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const progressbar = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("progressbar");

export const Default: Story = {};

export const LargeSize: Story = {
  args: { size: "lg", showPercentage: true },
};

export const Theme: Story = {
  args: { step: 3, theme: "orange" },
};

export const CustomTheme: Story = {
  args: {
    step: 2,
    totalSteps: 6,
    theme: { primary: "ink-blue-5", secondary: "surface-gray-3" },
  },
};

export const CompletedSolid: Story = {
  args: { step: 9, totalSteps: 9, variant: "solid" },
};

export const CompletedOutline: Story = {
  args: { step: 9, totalSteps: 9, variant: "outline" },
};

export const Sizes: Story = {
  render: (args) => ({
    components: { CircularProgressBar },
    setup: () => ({ args, sizes: ["xs", "sm", "md", "lg", "xl"] }),
    template: `
      <div class="flex items-center gap-4 p-4">
        <CircularProgressBar v-for="size in sizes" :key="size" v-bind="args" :size="size" />
      </div>
    `,
  }),
};

export const Themes: Story = {
  args: { step: 3 },
  render: (args) => ({
    components: { CircularProgressBar },
    setup: () => ({
      args,
      themes: ["black", "red", "green", "blue", "orange"],
    }),
    template: `
      <div class="flex items-center gap-4 p-4">
        <CircularProgressBar v-for="theme in themes" :key="theme" v-bind="args" :theme="theme" />
      </div>
    `,
  }),
};

export const ShowsStep: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const bar = progressbar(canvasElement);
    await expect(bar).toHaveAttribute("aria-valuenow", "25");
    await expect(bar).toHaveAttribute("aria-valuemin", "0");
    await expect(bar).toHaveAttribute("aria-valuemax", "100");
    await expect(bar).toHaveAttribute("aria-valuetext", "Step 1 of 4");
    await expect(bar).toHaveTextContent(/^1$/);
  },
};

export const ShowsPercentage: Story = {
  tags: ["interaction"],
  args: { step: 1, totalSteps: 3, showPercentage: true },
  play: async ({ canvasElement }) => {
    const bar = progressbar(canvasElement);
    await expect(bar).toHaveAttribute("aria-valuenow", "33");
    await expect(bar).toHaveAttribute("aria-valuetext", "33%");
    await expect(bar).toHaveTextContent("33%");
  },
};

export const ShowsCompleted: Story = {
  tags: ["interaction"],
  args: { step: 4, totalSteps: 4, showPercentage: true },
  play: async ({ canvasElement }) => {
    const bar = progressbar(canvasElement);
    await expect(bar).toHaveAttribute("aria-valuenow", "100");
    await expect(bar).toHaveAttribute("aria-valuetext", "Completed");
    await expect(bar).toHaveTextContent("");
    await expect(bar.querySelector(".lucide-check")).not.toBeNull();
  },
};

export const ClampsOverflow: Story = {
  tags: ["interaction"],
  args: { step: 6, totalSteps: 4 },
  play: async ({ canvasElement }) => {
    const bar = progressbar(canvasElement);
    await expect(bar).toHaveAttribute("aria-valuenow", "100");
    await expect(bar).toHaveAttribute("aria-valuetext", "Completed");
    await expect(bar.querySelector(".lucide-check")).not.toBeNull();
  },
};

export const AdvanceToCompletion: Story = {
  tags: ["interaction"],
  args: { step: 0, totalSteps: 2 },
  render: (args) => ({
    components: { CircularProgressBar, Button },
    setup: () => ({ args, step: ref(args.step ?? 0) }),
    template: `
      <div class="flex items-center gap-4 p-4">
        <CircularProgressBar v-bind="args" :step="step" />
        <Button label="Next step" @click="step++" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("progressbar");
    const next = canvas.getByRole("button", { name: "Next step" });
    await expect(bar).toHaveAttribute("aria-valuenow", "0");
    await expect(bar).toHaveTextContent(/^0$/);

    await userEvent.click(next);
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "50"));
    await expect(bar).toHaveTextContent(/^1$/);
    await expect(bar.querySelector(".lucide-check")).toBeNull();

    await userEvent.click(next);
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "100"));
    await expect(bar).toHaveAttribute("aria-valuetext", "Completed");
    await expect(bar.querySelector(".lucide-check")).not.toBeNull();
  },
};
