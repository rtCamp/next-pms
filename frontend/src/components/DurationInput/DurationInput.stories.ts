import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import DurationInput from "./DurationInput.vue";

const meta = {
  title: "Components/DurationInput",
  component: DurationInput,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
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
  render: (args) => ({
    components: { DurationInput },
    setup: () => ({ args, value: ref(args.modelValue ?? 0) }),
    template: `
      <div class="w-48">
        <DurationInput v-bind="args" v-model="value" />
      </div>
    `,
  }),
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

export const Input: Story = {
  tags: ["interaction"],
  args: { modelValue: 0 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    const onUpdate = args["onUpdate:modelValue"];

    const enterDuration = async (
      typed: string,
      expectedChange: number,
      expectedValue: string,
    ) => {
      await userEvent.click(input);
      await userEvent.clear(input);
      await userEvent.type(input, typed);
      await waitFor(() => expect(input).toHaveValue(typed));

      await userEvent.tab();
      await waitFor(() => {
        expect(onUpdate).toHaveBeenLastCalledWith(expectedChange);
        expect(input).toHaveValue(expectedValue);
      });
    };

    await enterDuration("1", 1, "01:00");

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "7");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveValue("01:00"));
    await expect(onUpdate).toHaveBeenCalledTimes(1);

    await enterDuration("1.5", 1.5, "01:30");
    await enterDuration("5:3", 5.05, "05:03");
    await enterDuration(".5", 0.5, "00:30");
    await enterDuration(":30", 0.5, "00:30");
    await enterDuration("5:", 5, "05:00");
    await enterDuration("1:75", 2.25, "02:15");
  },
};

export const RejectsInvalidCharacters: Story = {
  tags: ["interaction"],
  args: { modelValue: 0 },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole("textbox");

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "2h:1.5m");
    await waitFor(() => expect(input).toHaveValue("2:15"));

    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(2.25);
      expect(input).toHaveValue("02:15");
    });
    await expect(input).not.toHaveFocus();
  },
};

export const Slider: Story = {
  tags: ["interaction"],
  args: { modelValue: 3.5, hoursLeft: 4 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider", { name: "Duration" });
    await expect(canvas.getByText("30m left")).toBeInTheDocument();

    await userEvent.click(slider);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");

    await waitFor(() => {
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(4.5);
      expect(canvas.getByRole("textbox")).toHaveValue("04:30");
      expect(canvas.getByText("30m over")).toBeInTheDocument();
    });
    await expect(slider).toHaveAttribute("aria-valuetext", "4h 30m");
  },
};

export const ClampsToMax: Story = {
  tags: ["interaction"],
  args: { modelValue: 2 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "12");
    await userEvent.tab();

    await waitFor(() => {
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(8);
      expect(input).toHaveValue("08:00");
    });
    await expect(canvas.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      "480",
    );
  },
};

export const AllowOverflow: Story = {
  tags: ["interaction"],
  args: { modelValue: 2, allowOverflow: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "10:30");
    await userEvent.tab();

    await waitFor(() => {
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(10.5);
      expect(input).toHaveValue("10:30");
      expect(canvas.getByText("2h 30m over")).toBeInTheDocument();
    });
    await expect(canvas.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      "480",
    );
  },
};

export const DisabledState: Story = {
  tags: ["interaction"],
  args: { disabled: true, loading: true, error: "Locked" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await expect(input).toBeDisabled();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleErrorMessage("Locked");
    await expect(canvas.getByRole("slider")).not.toHaveAttribute("tabindex");
    await expect(canvas.getByRole("status", { name: "Loading" })).toBeVisible();
  },
};
