import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ReleaseCard from "./ReleaseCard.vue";
import { LATEST_RELEASE, OLDER_RELEASE } from "./WhatsNew.fixtures";

const meta = {
  title: "Pages/WhatsNew/ReleaseCard",
  component: ReleaseCard,
  parameters: { layout: "padded" },
  args: { release: LATEST_RELEASE, isLatest: true },
  render: (args) => ({
    components: { ReleaseCard },
    setup: () => ({ args }),
    template: `<div class="w-[720px]"><ReleaseCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ReleaseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The newest release: open, with the Latest badge and no toggle. */
export const Latest: Story = {};

/** An older release starts closed; its header opens it. */
export const Older: Story = {
  args: { release: OLDER_RELEASE, isLatest: false },
};
