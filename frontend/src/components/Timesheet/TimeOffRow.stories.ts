import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TimeOffRow from "./TimeOffRow.vue";
import { ENTRIES, TOTAL } from "./TimeOffRow.fixtures";

const meta = {
  title: "Components/Timesheet/TimeOffRow",
  component: TimeOffRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Time-off",
    timeOffEntries: ENTRIES,
    totalHours: TOTAL,
  },
  render: (args) => ({
    components: { TimeOffRow },
    setup: () => ({ args }),
    template: `<TimeOffRow v-bind="args" />`,
  }),
} satisfies Meta<typeof TimeOffRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomPrefix: Story = {
  render: (args) => ({
    components: { TimeOffRow },
    setup: () => ({ args }),
    template: `
      <TimeOffRow v-bind="args">
        <template #prefix>
          <span class="lucide-plane size-4" aria-hidden="true" />
        </template>
      </TimeOffRow>
    `,
  }),
};
