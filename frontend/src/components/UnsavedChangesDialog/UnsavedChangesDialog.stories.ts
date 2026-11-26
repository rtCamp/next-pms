import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import UnsavedChangesDialog from "./UnsavedChangesDialog.vue";

const meta = {
  title: "Components/UnsavedChangesDialog",
  component: UnsavedChangesDialog,
  tags: ["autodocs"],
  args: {
    open: true,
    "onUpdate:open": fn(),
    onDiscard: fn(),
    onKeepEditing: fn(),
    onSave: fn(),
  },
  render: (args) => ({
    components: { UnsavedChangesDialog },
    setup: () => ({ args }),
    template: `<UnsavedChangesDialog v-bind="args" />`,
  }),
} satisfies Meta<typeof UnsavedChangesDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
