import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import MonthPicker from "./MonthPicker.vue";

const meta = {
  title: "Components/MonthPicker",
  component: MonthPicker,
  tags: ["autodocs"],
  args: {
    placeholder: "Select month",
    "onUpdate:modelValue": fn(),
  },
  argTypes: {
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
    align: { control: "select", options: ["start", "center", "end"] },
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { MonthPicker },
      setup: () => ({
        args,
        update: (modelValue: string) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { modelValue });
          updateArgs({ modelValue });
        },
      }),
      template: `
        <div class="w-80">
          <MonthPicker v-bind="args" @update:model-value="update" />
        </div>
      `,
    };
  },
} satisfies Meta<typeof MonthPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FitWidth: Story = {
  render: (args) => ({
    components: { MonthPicker },
    setup: () => ({ args }),
    template: `
      <div class="inline-block">
        <MonthPicker v-bind="args" class="!w-auto" />
      </div>
    `,
  }),
};

export const InlineTrigger: Story = {
  args: { modelValue: "January 2026" },
  render: (args) => ({
    components: { MonthPicker },
    setup: () => ({ args }),
    template: `
      <MonthPicker v-bind="args">
        <template #trigger="{ label }">
          <button type="button" class="flex items-center gap-0.5 text-sm text-ink-gray-5">
            {{ label }}
            <span class="lucide-chevron-down size-4" aria-hidden="true" />
          </button>
        </template>
      </MonthPicker>
    `,
  }),
};
