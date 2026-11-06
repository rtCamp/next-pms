import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import DurationInput from "./DurationInput.vue";

const meta = {
  title: "Components/DurationInput",
  component: DurationInput,
  tags: ["autodocs"],
  args: {
    label: "Duration",
    size: "sm",
    variant: "subtle",
    snap: "step",
    maxDuration: 8,
    hoursLeft: 8,
    modelValue: 0.5,
    loading: false,
    error: false,
    disabled: false,
    allowOverflow: false,
    "onUpdate:modelValue": fn(),
  },
  argTypes: {
    modelValue: { control: "number" },
    snap: { control: "select", options: ["step", "smooth"] },
    size: { control: "select", options: ["sm", "md"] },
    variant: { control: "select", options: ["subtle", "outline"] },
    error: { control: "text" },
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { DurationInput },
      setup: () => ({
        args,
        update: (modelValue: number) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { modelValue });
          updateArgs({ modelValue });
        },
      }),
      template: `
        <div class="w-48">
          <DurationInput v-bind="args" @update:model-value="update" />
        </div>
      `,
    };
  },
} satisfies Meta<typeof DurationInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialValue: Story = {
  args: { hoursLeft: 5.5, modelValue: 2.5 },
};

export const OverHours: Story = {
  args: { hoursLeft: 1, modelValue: 6 },
};

export const CustomMax: Story = {
  args: { label: "Sprint Duration", maxDuration: 10, hoursLeft: 10 },
};

export const Disabled: Story = {
  args: { hoursLeft: 5, disabled: true },
};

export const Outline: Story = {
  args: { variant: "outline", modelValue: 2 },
};

export const Loading: Story = {
  args: { loading: true, modelValue: 2 },
};

export const ErrorState: Story = {
  name: "Error",
  args: { error: true, modelValue: 2 },
};

export const ErrorMessage: Story = {
  args: { error: "Duration is required", modelValue: 0 },
};

export const InlineLabel: Story = {
  args: {
    label: "4h 30m left today",
    inlineLabel: "Duration",
    required: true,
    snap: "smooth",
    modelValue: 1,
  },
};

export const MediumOutlineWithoutLabel: Story = {
  args: { label: undefined, size: "md", variant: "outline", modelValue: 3 },
};
