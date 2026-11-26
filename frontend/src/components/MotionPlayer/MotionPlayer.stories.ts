import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MotionPlayer from "./MotionPlayer.vue";
import {
  SUBMIT_WEEK_TITLE,
  loadForever,
  loadSubmitWeek,
} from "./MotionPlayer.fixtures";

const meta = {
  title: "Components/MotionPlayer",
  component: MotionPlayer,
  tags: ["autodocs"],
  args: { load: loadSubmitWeek, label: SUBMIT_WEEK_TITLE },
  argTypes: { load: { control: false } },
  render: (args) => ({
    components: { MotionPlayer },
    setup: () => ({ args }),
    template: `<div class="w-96"><MotionPlayer v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof MotionPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Expandable: Story = { args: { expandable: true } };

export const Collapsible: Story = { args: { collapsible: true } };

export const Paused: Story = { args: { paused: true } };

export const Loading: Story = { args: { load: loadForever } };
