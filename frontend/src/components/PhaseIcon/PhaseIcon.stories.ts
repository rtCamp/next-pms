import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PhaseIcon from "./PhaseIcon.vue";
import { PROJECT_PHASE_COLORS } from "./types";

const meta = {
  title: "Components/PhaseIcon",
  component: PhaseIcon,
  tags: ["autodocs"],
  args: { color: "gray" },
  argTypes: {
    color: { control: "select", options: [...PROJECT_PHASE_COLORS] },
  },
  render: (args) => ({
    components: { PhaseIcon },
    setup: () => ({ args }),
    template: `<PhaseIcon v-bind="args" />`,
  }),
} satisfies Meta<typeof PhaseIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gray: Story = { args: { color: "gray" } };
export const Blue: Story = { args: { color: "blue" } };
export const Orange: Story = { args: { color: "orange" } };
export const Cyan: Story = { args: { color: "cyan" } };
export const Green: Story = { args: { color: "green" } };
export const Purple: Story = { args: { color: "purple" } };
