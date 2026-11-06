import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ProgressBar from "./ProgressBar.vue";

const meta = {
  title: "Components/ProgressBar/Interactions",
  component: ProgressBar,
  tags: ["interaction"],
  args: { value: 40, maxValue: 100, size: "md" },
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

export const ReportsClampedValue: Story = {
  args: { value: 150, maxValue: 120 },
  play: async ({ canvasElement }) => {
    const progressbar = bar(canvasElement);
    await expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    await expect(progressbar).toHaveAttribute("aria-valuemax", "120");
    await expect(progressbar).toHaveAttribute("aria-valuenow", "120");
  },
};

export const NamedByLabel: Story = {
  args: { label: "Hours logged" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("progressbar", { name: "Hours logged" }),
    ).toBeInTheDocument();
  },
};

export const EmptyWhenMaxIsZero: Story = {
  args: { value: 10, maxValue: 0 },
  play: async ({ canvasElement }) => {
    await expect(bar(canvasElement)).toHaveAttribute("aria-valuenow", "0");
  },
};

export const FollowsValue: Story = {
  args: { value: 20 },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { ProgressBar, Button },
      setup: () => ({
        args,
        log: (hours: number) => {
          const value = (args.value ?? 0) + hours;
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { value });
          updateArgs({ value });
        },
      }),
      template: `
        <div class="flex w-80 flex-col gap-4 p-4">
          <ProgressBar v-bind="args" />
          <Button label="Log 30" @click="log(30)" />
        </div>
      `,
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const progressbar = canvas.getByRole("progressbar");
    await expect(progressbar).toHaveAttribute("aria-valuenow", "20");

    await userEvent.click(canvas.getByRole("button", { name: "Log 30" }));
    await waitFor(() =>
      expect(progressbar).toHaveAttribute("aria-valuenow", "50"),
    );
  },
};
