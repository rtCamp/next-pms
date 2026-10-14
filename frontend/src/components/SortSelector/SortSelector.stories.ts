import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import SortSelector from "./SortSelector.vue";
import type { SortState } from "./types";
import { FIELDS } from "./SortSelector.fixtures";

const meta = {
  title: "Components/SortSelector",
  component: SortSelector,
  tags: ["autodocs"],
  args: {
    fields: FIELDS,
    modelValue: null,
    "onUpdate:modelValue": fn(),
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { SortSelector },
      setup: () => ({
        args,
        update: (modelValue: SortState | null) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { modelValue });
          updateArgs({ modelValue });
        },
      }),
      template: `<SortSelector v-bind="args" @update:model-value="update" />`,
    };
  },
} satisfies Meta<typeof SortSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsorted: Story = {};

export const Sorted: Story = {
  args: { modelValue: { field: "custom_project_phase", order: "asc" } },
};
