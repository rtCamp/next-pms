import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Button } from "frappe-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import LoadingOverlay from "./LoadingOverlay.vue";

const ROWS = ["Website redesign", "Mobile app", "Data migration", "SEO audit"];

const meta = {
  title: "Components/LoadingOverlay",
  component: LoadingOverlay,
  tags: ["autodocs"],
  args: { active: false },
  render: (args) => ({
    components: { LoadingOverlay },
    setup: () => ({ args, rows: ROWS }),
    template: `
      <div class="flex h-48 w-80 flex-col">
        <LoadingOverlay v-bind="args">
          <ul class="divide-y divide-outline-gray-1 rounded border border-outline-gray-2">
            <li v-for="row in rows" :key="row" class="px-3 py-2 text-base text-ink-gray-8">{{ row }}</li>
          </ul>
        </LoadingOverlay>
      </div>
    `,
  }),
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Active: Story = { args: { active: true } };

export const ShowsSpinnerWhileActive: Story = {
  tags: ["interaction"],
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
  tags: ["interaction"],
  render: () => ({
    components: { LoadingOverlay, Button },
    setup: () => ({ active: ref(false), rows: ROWS }),
    template: `
      <div class="flex h-56 w-80 flex-col gap-2">
        <Button :label="active ? 'Stop loading' : 'Start loading'" @click="active = !active" />
        <LoadingOverlay :active="active">
          <ul class="divide-y divide-outline-gray-1 rounded border border-outline-gray-2">
            <li v-for="row in rows" :key="row" class="px-3 py-2 text-base text-ink-gray-8">{{ row }}</li>
          </ul>
        </LoadingOverlay>
      </div>
    `,
  }),
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
