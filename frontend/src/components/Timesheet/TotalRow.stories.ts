import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import TotalRow from "./TotalRow.vue";
import { LEVELS, TOTAL_WEEK } from "./TotalRow.fixtures";

const meta = {
  title: "Components/Timesheet/TotalRow",
  component: TotalRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    levels: LEVELS,
    totalHours: "33:15",
    totalHoursTheme: "green",
    totalTimeEntries: TOTAL_WEEK,
    starred: false,
    onStar: fn(),
    onCellClick: fn(),
  },
  argTypes: {
    totalHoursTheme: {
      control: "select",
      options: ["green", "red", "amber", "gray"],
    },
  },
  render: (args) => ({
    components: { TotalRow },
    setup: () => ({ args }),
    template: `<TotalRow v-bind="args" />`,
  }),
} satisfies Meta<typeof TotalRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Starred: Story = { args: { starred: true } };

export const Disabled: Story = { args: { disabled: true } };

export const ShortWeek: Story = { args: { totalHoursTheme: "red" } };

export const CustomPrefix: Story = {
  render: (args) => ({
    components: { TotalRow },
    setup: () => ({ args }),
    template: `
      <TotalRow v-bind="args">
        <template #prefix>
          <span class="lucide-sigma size-4 text-ink-gray-8" aria-hidden="true" />
        </template>
      </TotalRow>
    `,
  }),
};
