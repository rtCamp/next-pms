import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import MonthPicker from "./MonthPicker.vue";

const meta = {
  title: "Components/MonthPicker/Interactions",
  component: MonthPicker,
  tags: ["interaction"],
  args: {
    placeholder: "Select month",
    "onUpdate:modelValue": fn(),
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

const toggle = () =>
  screen.getByRole("button", { name: /, choose (year|month)$/ });
const rangeOf = (year: number) => {
  const start = year - (year % 12);
  return `${start} - ${start + 11}`;
};

/** Opens the picker and returns the year it shows. */
async function open(canvasElement: HTMLElement, name: string | RegExp) {
  const trigger = within(canvasElement).getByRole("button", { name });
  await userEvent.click(trigger);
  await screen.findByRole("button", { name: "Jan" });
  return { trigger, year: Number(toggle().textContent) };
}

export const SelectMonth: Story = {
  play: async ({ canvasElement, args }) => {
    const { trigger, year } = await open(canvasElement, /select month/i);
    await expect(trigger).toHaveTextContent("Select month");

    await userEvent.click(screen.getByRole("button", { name: "Mar" }));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith(`March ${year}`),
    );
    await waitFor(() => expect(trigger).toHaveTextContent(`March ${year}`));
  },
};

export const SelectYearThenMonth: Story = {
  play: async ({ canvasElement, args }) => {
    const { trigger, year } = await open(canvasElement, /select month/i);
    await userEvent.click(toggle());
    await waitFor(() => expect(toggle()).toHaveTextContent(rangeOf(year)));

    await userEvent.click(
      screen.getByRole("button", { name: String(year + 1) }),
    );
    await waitFor(() => expect(toggle()).toHaveTextContent(String(year + 1)));

    await userEvent.click(await screen.findByRole("button", { name: "Jun" }));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(
        `June ${year + 1}`,
      ),
    );
    await waitFor(() => expect(trigger).toHaveTextContent(`June ${year + 1}`));
  },
};

export const NavigateBetweenYears: Story = {
  play: async ({ canvasElement }) => {
    const { trigger, year } = await open(canvasElement, /select month/i);

    await userEvent.click(screen.getByLabelText("Next year"));
    await waitFor(() => expect(toggle()).toHaveTextContent(String(year + 1)));

    await userEvent.click(screen.getByLabelText("Previous year"));
    await userEvent.click(screen.getByLabelText("Previous year"));
    await waitFor(() => expect(toggle()).toHaveTextContent(String(year - 1)));

    await userEvent.click(screen.getByRole("button", { name: "Sep" }));
    await waitFor(() =>
      expect(trigger).toHaveTextContent(`September ${year - 1}`),
    );
  },
};

export const NavigateYearRanges: Story = {
  play: async ({ canvasElement }) => {
    const { year } = await open(canvasElement, /select month/i);
    await userEvent.click(toggle());
    await waitFor(() => expect(toggle()).toHaveTextContent(rangeOf(year)));

    await userEvent.click(screen.getByLabelText("Next years"));
    await waitFor(() => expect(toggle()).toHaveTextContent(rangeOf(year + 12)));

    await userEvent.click(screen.getByLabelText("Previous years"));
    await userEvent.click(screen.getByLabelText("Previous years"));
    await waitFor(() => expect(toggle()).toHaveTextContent(rangeOf(year - 12)));
  },
};

export const OpensOnSelectedMonth: Story = {
  args: { modelValue: "March 2027" },
  play: async ({ canvasElement }) => {
    await open(canvasElement, "March 2027");
    await expect(toggle()).toHaveTextContent("2027");
    await expect(screen.getByRole("button", { name: "Mar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(toggle());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "2027" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
  },
};

export const ReopensOnMonthView: Story = {
  args: { modelValue: "March 2027" },
  play: async ({ canvasElement }) => {
    const { trigger } = await open(canvasElement, "March 2027");
    await userEvent.click(toggle());
    await waitFor(() => expect(toggle()).toHaveTextContent(rangeOf(2027)));

    await userEvent.click(trigger);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /, choose (year|month)$/ }),
      ).toBeNull(),
    );

    await userEvent.click(trigger);
    await screen.findByRole("button", { name: "Jan" });
    await expect(toggle()).toHaveTextContent("2027");
    await expect(screen.queryByText(rangeOf(2027))).toBeNull();
  },
};
