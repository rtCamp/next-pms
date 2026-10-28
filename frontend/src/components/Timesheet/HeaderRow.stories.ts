import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HeaderRow from "./HeaderRow.vue";

const meta = {
  title: "Components/Timesheet/HeaderRow",
  component: HeaderRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    levels: ["Week", "Project", "Task"],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  render: (args) => ({
    components: { HeaderRow },
    setup: () => ({ args }),
    template: `<HeaderRow v-bind="args" />`,
  }),
} satisfies Meta<typeof HeaderRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Personal: Story = {};

export const Team: Story = {
  args: { levels: ["Week", "Member", "Project", "Task"] },
};

export const WithHelp: Story = {
  args: {
    help: {
      title: "Day cells",
      summary: "Hours logged on each day.",
    },
    totalHelp: {
      title: "Total",
      summary: "Hours logged in the week plus time-off.",
    },
  },
};
