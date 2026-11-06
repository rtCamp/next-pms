import type { Meta, StoryObj } from "@storybook/vue3-vite";
import RichText from "./RichText.vue";
import { CODE, FORMATTED, LISTS, QUOTE, RICH_TEXT } from "./RichText.fixtures";

const meta = {
  title: "Components/RichText",
  component: RichText,
  tags: ["autodocs"],
  args: { content: FORMATTED },
  argTypes: {
    content: { control: "text" },
    kit: { control: "inline-radio", options: ["comment", "richText"] },
  },
  render: (args) => ({
    components: { RichText },
    setup: () => ({ args }),
    template: `<div class="w-96"><RichText v-bind="args" class="prose-sm text-ink-gray-7" /></div>`,
  }),
} satisfies Meta<typeof RichText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Formatted: Story = {};

export const Lists: Story = { args: { content: LISTS } };

export const CodeBlock: Story = { args: { content: CODE } };

export const Quote: Story = { args: { content: QUOTE } };

export const Empty: Story = { args: { content: "" } };

/** Long-form content written with the rich-text kit: tables, task lists, highlights. */
export const RichTextKit: Story = {
  args: { content: RICH_TEXT, kit: "richText" },
};
