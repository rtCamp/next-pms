import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import MonthPicker from "./MonthPicker.vue";

const TOGGLE = "Toggle between month and year selection";
const currentYear = new Date().getFullYear();
const rangeOf = (year: number) => {
  const start = year - (year % 12);
  return `${start} - ${start + 11}`;
};

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
  render: (args) => ({
    components: { MonthPicker },
    setup: () => ({ args, value: ref(args.modelValue ?? "") }),
    template: `
      <div class="w-80">
        <MonthPicker v-bind="args" v-model="value" />
      </div>
    `,
  }),
} satisfies Meta<typeof MonthPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FitWidth: Story = {
  render: (args) => ({
    components: { MonthPicker },
    setup: () => ({ args, value: ref(args.modelValue ?? "") }),
    template: `
      <div class="inline-block">
        <MonthPicker v-bind="args" v-model="value" class="!w-auto" />
      </div>
    `,
  }),
};

export const InlineTrigger: Story = {
  args: { modelValue: "January 2026", icon: "lucide-chevron-down" },
  render: (args) => ({
    components: { MonthPicker },
    setup: () => ({ args, value: ref(args.modelValue ?? "") }),
    template: `
      <MonthPicker
        v-bind="args"
        v-model="value"
        variant="ghost"
        class="!h-auto !w-auto !justify-center gap-0.5 !p-0 text-sm !text-ink-gray-5 !bg-transparent"
      />
    `,
  }),
};

export const SelectMonth: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: /select month/i,
    });
    await expect(trigger).toHaveTextContent("Select month");

    await userEvent.click(trigger);
    await screen.findByRole("button", { name: "Jan" });
    await expect(
      screen.getByRole("button", { name: TOGGLE }),
    ).toHaveTextContent(String(currentYear));

    await userEvent.click(screen.getByRole("button", { name: "Mar" }));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith(
        `March ${currentYear}`,
      ),
    );
    await waitFor(() =>
      expect(trigger).toHaveTextContent(`March ${currentYear}`),
    );
  },
};

export const SelectYearThenMonth: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: /select month/i,
    });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("button", { name: TOGGLE }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: TOGGLE })).toHaveTextContent(
        rangeOf(currentYear),
      ),
    );

    const targetYear = currentYear + 1;
    await userEvent.click(
      screen.getByRole("button", { name: String(targetYear) }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: TOGGLE })).toHaveTextContent(
        String(targetYear),
      ),
    );

    await userEvent.click(await screen.findByRole("button", { name: "Jun" }));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(
        `June ${targetYear}`,
      ),
    );
    await waitFor(() =>
      expect(trigger).toHaveTextContent(`June ${targetYear}`),
    );
  },
};

export const NavigateBetweenYears: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: /select month/i,
    });
    await userEvent.click(trigger);
    await screen.findByRole("button", { name: "Jan" });

    await userEvent.click(screen.getByLabelText("Next year"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: TOGGLE })).toHaveTextContent(
        String(currentYear + 1),
      ),
    );

    await userEvent.click(screen.getByLabelText("Previous year"));
    await userEvent.click(screen.getByLabelText("Previous year"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: TOGGLE })).toHaveTextContent(
        String(currentYear - 1),
      ),
    );

    await userEvent.click(screen.getByRole("button", { name: "Sep" }));
    await waitFor(() =>
      expect(trigger).toHaveTextContent(`September ${currentYear - 1}`),
    );
  },
};

export const NavigateYearRanges: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: /select month/i }),
    );
    await userEvent.click(await screen.findByRole("button", { name: TOGGLE }));
    const toggle = () => screen.getByRole("button", { name: TOGGLE });
    await waitFor(() =>
      expect(toggle()).toHaveTextContent(rangeOf(currentYear)),
    );

    await userEvent.click(screen.getByLabelText("Next years"));
    await waitFor(() =>
      expect(toggle()).toHaveTextContent(rangeOf(currentYear + 12)),
    );

    await userEvent.click(screen.getByLabelText("Previous years"));
    await userEvent.click(screen.getByLabelText("Previous years"));
    await waitFor(() =>
      expect(toggle()).toHaveTextContent(rangeOf(currentYear - 12)),
    );
  },
};

export const ReopenPicker: Story = {
  tags: ["interaction"],
  args: { modelValue: `March ${currentYear + 1}` },
  play: async ({ canvasElement }) => {
    const targetYear = currentYear + 1;
    const trigger = within(canvasElement).getByRole("button", {
      name: `March ${targetYear}`,
    });

    await userEvent.click(trigger);
    await expect(
      await screen.findByRole("button", { name: TOGGLE }),
    ).toHaveTextContent(String(targetYear));
    await expect(screen.getByRole("button", { name: "Mar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: TOGGLE }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: String(targetYear) }),
      ).toHaveAttribute("aria-pressed", "true"),
    );

    await userEvent.click(trigger);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: TOGGLE })).toBeNull(),
    );

    await userEvent.click(trigger);
    await screen.findByRole("button", { name: "Jan" });
    await expect(
      screen.getByRole("button", { name: TOGGLE }),
    ).toHaveTextContent(String(targetYear));
    await expect(screen.queryByText(rangeOf(targetYear))).toBeNull();
  },
};
