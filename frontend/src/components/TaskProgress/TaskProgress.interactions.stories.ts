import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import TaskProgress from "./TaskProgress.vue";

const meta = {
  title: "Components/TaskProgress/Interactions",
  component: TaskProgress,
  tags: ["interaction"],
  args: { value: 45, size: "md" },
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

export const ShowsProgress: Story = {
  play: async ({ canvasElement }) => {
    const progressbar = bar(canvasElement);
    await expect(progressbar).toHaveAccessibleName("Task progress");
    await expect(progressbar).toHaveAttribute("aria-valuenow", "45");
    await expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    await expect(progressbar).toHaveAttribute("aria-valuetext", "45%");
  },
};

export const ShowsOverflow: Story = {
  args: { value: 125 },
  play: async ({ canvasElement }) => {
    const progressbar = bar(canvasElement);
    await expect(progressbar).toHaveAttribute("aria-valuenow", "100");
    await expect(progressbar).toHaveAttribute("aria-valuetext", "125%");
  },
};

export const ClampsNegative: Story = {
  args: { value: -10 },
  play: async ({ canvasElement }) => {
    await expect(bar(canvasElement)).toHaveAttribute("aria-valuenow", "0");
    await expect(bar(canvasElement)).toHaveAttribute("aria-valuetext", "0%");
  },
};

export const GrowsPastEstimate: Story = {
  args: { value: 75 },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { TaskProgress, Button },
      setup: () => ({
        args,
        log: (percent: number) => {
          const value = (args.value ?? 0) + percent;
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { value });
          updateArgs({ value });
        },
      }),
      template: `
        <div class="flex w-80 flex-col gap-4 p-4">
          <TaskProgress v-bind="args" />
          <Button label="Log 25%" @click="log(25)" />
        </div>
      `,
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByRole("button", { name: "Log 25%" });

    await userEvent.click(log);
    await waitFor(() =>
      expect(bar(canvasElement)).toHaveAttribute("aria-valuetext", "100%"),
    );

    await userEvent.click(log);
    await waitFor(() =>
      expect(bar(canvasElement)).toHaveAttribute("aria-valuetext", "125%"),
    );
    await expect(bar(canvasElement)).toHaveAttribute("aria-valuenow", "100");
  },
};
