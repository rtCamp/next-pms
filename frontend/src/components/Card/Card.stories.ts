import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Badge, Button } from "frappe-ui";
import { expect, fn, userEvent, within } from "storybook/test";
import Card from "./Card.vue";

const onRefresh = fn();
const onBack = fn();
const onRowClick = fn();

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    title: "Utilisation",
    subtitle: "Billable hours logged this week",
    loading: false,
  },
  render: (args) => ({
    components: { Card },
    setup: () => ({ args }),
    template: `
      <Card v-bind="args" class="w-96">
        <p class="text-base text-ink-gray-7">32 of 40 hours billed.</p>
      </Card>
    `,
  }),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleAndSubtitle: Story = {};

export const WithActions: Story = {
  render: (args) => ({
    components: { Card, Button, Badge },
    setup: () => ({ args, onRefresh }),
    template: `
      <Card v-bind="args" class="w-96">
        <template #actions>
          <Badge label="Live" theme="green" />
          <Button icon="lucide-refresh-cw" label="Refresh" @click="onRefresh" />
        </template>
        <p class="text-base text-ink-gray-7">32 of 40 hours billed.</p>
      </Card>
    `,
  }),
};

export const WithActionsLeft: Story = {
  render: (args) => ({
    components: { Card, Button },
    setup: () => ({ args, onBack }),
    template: `
      <Card v-bind="args" class="w-96">
        <template #actions-left>
          <Button variant="ghost" icon="lucide-arrow-left" label="Back" @click="onBack" />
        </template>
        <p class="text-base text-ink-gray-7">32 of 40 hours billed.</p>
      </Card>
    `,
  }),
};

export const Loading: Story = {
  args: { loading: true },
};

export const PlainContent: Story = {
  args: { title: undefined, subtitle: undefined },
  render: (args) => ({
    components: { Card },
    setup: () => ({ args }),
    template: `
      <Card v-bind="args" class="w-96">
        <p class="text-base text-ink-gray-7">
          A card with no heading only wraps its content.
        </p>
      </Card>
    `,
  }),
};

export const ClickSlotContent: Story = {
  tags: ["interaction"],
  render: (args) => ({
    components: { Card, Button },
    setup: () => ({ args, onRefresh, onBack, onRowClick }),
    template: `
      <Card v-bind="args" class="w-96">
        <template #actions-left>
          <Button variant="ghost" icon="lucide-arrow-left" label="Back" @click="onBack" />
        </template>
        <template #actions>
          <Button icon="lucide-refresh-cw" label="Refresh" @click="onRefresh" />
        </template>
        <button type="button" class="text-base text-ink-gray-7" @click="onRowClick">
          Open report
        </button>
      </Card>
    `,
  }),
  play: async ({ canvasElement }) => {
    onRefresh.mockClear();
    onBack.mockClear();
    onRowClick.mockClear();
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { level: 2, name: "Utilisation" }),
    ).toBeVisible();
    await expect(
      canvas.getByText("Billable hours logged this week"),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Back" }));
    await expect(onBack).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await expect(onRefresh).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole("button", { name: "Open report" }));
    await expect(onRowClick).toHaveBeenCalledTimes(1);
  },
};

export const LoadingHidesContent: Story = {
  tags: ["interaction"],
  args: { loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status", { name: "Loading" })).toBeVisible();
    await expect(canvas.getByText("Loading...")).toBeVisible();
    await expect(canvasElement.querySelector("[aria-busy]")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(canvas.queryByText("32 of 40 hours billed.")).toBeNull();
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Utilisation" }),
    ).toBeVisible();
  },
};

export const NoHeadingWithoutTitle: Story = {
  tags: ["interaction"],
  args: { title: undefined, subtitle: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("heading")).toBeNull();
    await expect(canvas.queryByRole("status")).toBeNull();
    await expect(canvas.getByText("32 of 40 hours billed.")).toBeVisible();
  },
};
