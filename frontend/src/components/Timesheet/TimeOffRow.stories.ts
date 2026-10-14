import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import TimeOffRow from "./TimeOffRow.vue";

const ENTRIES = ["", "", "08:00", "", "08:00", "", ""];
const TOTAL = "16:00";

const meta = {
  title: "Components/Timesheet/TimeOffRow",
  component: TimeOffRow,
  tags: ["autodocs"],
  args: {
    label: "Time-off",
    totalHours: "04:00",
    timeOffEntries: ["", "04:00", "", "", "", "", ""],
  },
  render: (args) => ({
    components: { TimeOffRow },
    setup: () => ({ args }),
    template: `
      <div class="w-[1180px]">
        <TimeOffRow v-bind="args" />
      </div>
    `,
  }),
  // TODO: fail on violations again after the design-system re-port.
  parameters: { layout: "padded", a11y: { test: "todo" } },
} satisfies Meta<typeof TimeOffRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DefaultState: Story = {
  tags: ["interaction"],
  args: { label: undefined, timeOffEntries: ENTRIES, totalHours: TOTAL },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Time-off")).toBeInTheDocument();
    await expect(canvas.getAllByText("08:00")).toHaveLength(2);
    await expect(canvas.getAllByText("-")).toHaveLength(5);
    const total = canvas.getByTestId("time-off-total");
    await expect(total).toHaveTextContent(TOTAL);
    // Colour is the behaviour under test and has no ARIA equivalent.
    await expect(total).toHaveClass("text-ink-amber-4");
  },
};

export const PrefixIcon: Story = {
  tags: ["interaction"],
  render: () => ({
    components: { TimeOffRow },
    setup: () => ({ ENTRIES, TOTAL }),
    template: `
      <div class="w-[1180px] space-y-2">
        <TimeOffRow :time-off-entries="ENTRIES" :total-hours="TOTAL" />
        <TimeOffRow :time-off-entries="ENTRIES" :total-hours="TOTAL">
          <template #prefix>
            <span class="lucide-star size-4" role="img" aria-label="Custom prefix icon" />
          </template>
        </TimeOffRow>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const [first, second] =
      within(canvasElement).getAllByTestId("time-off-row");
    await expect(first.querySelector(".lucide-calendar-x-2")).not.toBeNull();
    await expect(
      within(second).getByRole("img", { name: "Custom prefix icon" }),
    ).toBeInTheDocument();
    await expect(second.querySelector(".lucide-calendar-x-2")).toBeNull();
  },
};
