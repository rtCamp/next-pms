import type { Meta, StoryObj } from "@storybook/vue3-vite";
import InfoHoverCard from "./InfoHoverCard.vue";
import { BASIC_HELP, FULL_HELP, TOOLTIP } from "./InfoHoverCard.fixtures";

const meta = {
  title: "Components/InfoHoverCard",
  component: InfoHoverCard,
  tags: ["autodocs"],
  args: { help: BASIC_HELP },
  render: (args) => ({
    components: { InfoHoverCard },
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-1 p-4 text-base text-ink-gray-7">
        Field label
        <InfoHoverCard v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof InfoHoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
export const WithFormulaLegendAndDetails: Story = { args: { help: FULL_HELP } };
export const TooltipOnly: Story = {
  args: { help: undefined, tooltip: TOOLTIP },
};
