import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MotionDialogPlayer from "./MotionDialogPlayer.vue";
import { SUBMIT_WEEK_TITLE, loadSubmitWeek } from "./MotionPlayer.fixtures";

const meta = {
  title: "Components/MotionPlayer/MotionDialogPlayer",
  component: MotionDialogPlayer,
  tags: ["autodocs"],
  args: { motion: loadSubmitWeek, title: SUBMIT_WEEK_TITLE },
  argTypes: { motion: { control: false } },
  render: (args) => ({
    components: { MotionDialogPlayer },
    setup: () => ({ args }),
    template: `<div class="w-80"><MotionDialogPlayer v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof MotionDialogPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
