import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import DurationInput from "./DurationInput.vue";
import visual from "./DurationInput.stories";

const meta = {
  ...visual,
  title: "Components/DurationInput/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof DurationInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const enterDuration = async (
  input: HTMLElement,
  typed: string,
  onUpdate: unknown,
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

export const ParsesTypedDurations: Story = {
  args: { modelValue: 0 },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole("textbox");
    const onUpdate = args["onUpdate:modelValue"];

    await enterDuration(input, "1", onUpdate, 1, "01:00");
    await enterDuration(input, "1.5", onUpdate, 1.5, "01:30");
    await enterDuration(input, "5:3", onUpdate, 5.05, "05:03");
    await enterDuration(input, ".5", onUpdate, 0.5, "00:30");
    await enterDuration(input, ":30", onUpdate, 0.5, "00:30");
    await enterDuration(input, "5:", onUpdate, 5, "05:00");
    await enterDuration(input, "1:75", onUpdate, 2.25, "02:15");
  },
};

export const EscapeCancelsEdit: Story = {
  args: { modelValue: 1 },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole("textbox");

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "7");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveValue("01:00"));
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();
  },
};

export const RejectsInvalidCharacters: Story = {
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
