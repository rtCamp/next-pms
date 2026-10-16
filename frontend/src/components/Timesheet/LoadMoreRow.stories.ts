import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import LoadMoreRow from "./LoadMoreRow.vue";

const meta = {
  title: "Components/Timesheet/LoadMoreRow",
  component: LoadMoreRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { onLoadMore: fn() },
  render: (args) => ({
    components: { LoadMoreRow },
    setup: () => ({ args }),
    template: `<LoadMoreRow v-bind="args" />`,
  }),
} satisfies Meta<typeof LoadMoreRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = { args: { loading: true } };

export const Empty: Story = { args: { empty: true } };
