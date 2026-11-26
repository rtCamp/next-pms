import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import LoadingOverlay from "./LoadingOverlay.vue";
import visual from "./LoadingOverlay.stories";

const meta = {
  title: "Components/LoadingOverlay/Interactions",
  component: LoadingOverlay,
  tags: ["interaction"],
  args: { active: false },
  render: visual.render,
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShowsSpinnerWhileActive: Story = {
  args: { active: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status", { name: "Loading" })).toBeVisible();
    await expect(canvas.getByText("Mobile app")).toBeVisible();
    await expect(
      canvas.getByText("Mobile app").closest("[aria-busy]"),
    ).toHaveAttribute("aria-busy", "true");
  },
};

export const ToggleLoading: Story = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { LoadingOverlay, Button },
      setup: () => ({
        args,
        rows: ["Website redesign", "Mobile app", "Data migration", "SEO audit"],
        toggle: () => {
          const active = !args.active;
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { active });
          updateArgs({ active });
        },
      }),
      template: `
      <div class="flex h-56 w-80 flex-col gap-2">
        <Button :label="args.active ? 'Stop loading' : 'Start loading'" @click="toggle" />
        <LoadingOverlay v-bind="args">
          <ul class="divide-y divide-outline-gray-1 rounded-4 border border-outline-gray-2">
            <li v-for="row in rows" :key="row" class="px-3 py-2 text-base text-ink-gray-8">{{ row }}</li>
          </ul>
        </LoadingOverlay>
      </div>
    `,
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByText("SEO audit").closest("[aria-busy]")!;
    await expect(region).toHaveAttribute("aria-busy", "false");
    await expect(canvas.queryByRole("status")).toBeNull();

    await userEvent.click(
      canvas.getByRole("button", { name: "Start loading" }),
    );
    await waitFor(() => expect(region).toHaveAttribute("aria-busy", "true"));
    await expect(canvas.getByRole("status", { name: "Loading" })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Stop loading" }));
    await waitFor(() => expect(region).toHaveAttribute("aria-busy", "false"));
    await expect(canvas.queryByRole("status")).toBeNull();
  },
};
