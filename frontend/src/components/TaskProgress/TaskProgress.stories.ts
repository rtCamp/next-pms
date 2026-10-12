import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import TaskProgress from "./TaskProgress.vue";

const meta = {
  title: "Components/TaskProgress",
  component: TaskProgress,
  tags: ["autodocs"],
  args: { value: 45, size: "md" },
  argTypes: {
    value: { control: { type: "number", min: 0 } },
    size: { control: "select", options: ["sm", "md"] },
  },
  render: (args) => ({
    components: { TaskProgress },
    setup: () => ({ args }),
    template: `
      <div class="w-80 p-4">
        <TaskProgress v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof TaskProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

const bar = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("progressbar");
const part = (canvasElement: HTMLElement, name: string) =>
  bar(canvasElement).querySelector<HTMLElement>(`[data-part="${name}"]`);

export const Default: Story = {};

export const Complete: Story = { args: { value: 100 } };

export const Overflow: Story = { args: { value: 125 } };

export const Small: Story = { args: { value: 140, size: "sm" } };

export const Empty: Story = { args: { value: 0 } };

export const ShowsProgress: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const progressbar = bar(canvasElement);
    await expect(progressbar).toHaveAttribute("aria-valuenow", "45");
    await expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    await expect(progressbar).toHaveAttribute("aria-valuetext", "45%");
    await expect(part(canvasElement, "base")?.style.width).toBe("45%");
    await expect(part(canvasElement, "overflow")).toBeNull();
  },
};

export const ShowsOverflow: Story = {
  tags: ["interaction"],
  args: { value: 125 },
  play: async ({ canvasElement }) => {
    const progressbar = bar(canvasElement);
    await expect(progressbar).toHaveAttribute("aria-valuenow", "100");
    await expect(progressbar).toHaveAttribute("aria-valuetext", "125%");
    await expect(part(canvasElement, "base")?.style.width).toBe("80%");
    await expect(part(canvasElement, "overflow")?.style.width).toBe("20%");
  },
};

export const ClampsNegative: Story = {
  tags: ["interaction"],
  args: { value: -10 },
  play: async ({ canvasElement }) => {
    await expect(bar(canvasElement)).toHaveAttribute("aria-valuenow", "0");
    await expect(part(canvasElement, "base")?.style.width).toBe("0%");
  },
};

export const GrowsPastEstimate: Story = {
  tags: ["interaction"],
  args: { value: 75 },
  render: (args) => ({
    components: { TaskProgress, Button },
    setup: () => ({ args, value: ref(args.value) }),
    template: `
      <div class="flex w-80 flex-col gap-4 p-4">
        <TaskProgress v-bind="args" :value="value" />
        <Button label="Log 25%" @click="value += 25" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByRole("button", { name: "Log 25%" });

    await userEvent.click(log);
    await waitFor(() =>
      expect(bar(canvasElement)).toHaveAttribute("aria-valuetext", "100%"),
    );
    await expect(part(canvasElement, "overflow")).toBeNull();

    await userEvent.click(log);
    await waitFor(() =>
      expect(bar(canvasElement)).toHaveAttribute("aria-valuetext", "125%"),
    );
    await expect(part(canvasElement, "overflow")).not.toBeNull();
  },
};
