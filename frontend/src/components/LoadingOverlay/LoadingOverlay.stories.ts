import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LoadingOverlay from "./LoadingOverlay.vue";

const meta = {
  title: "Components/LoadingOverlay",
  component: LoadingOverlay,
  tags: ["autodocs"],
  args: { active: false },
  render: (args) => ({
    components: { LoadingOverlay },
    setup: () => ({ args }),
    template: `
      <div class="flex h-48 w-80 flex-col">
        <LoadingOverlay v-bind="args">
          <ul class="divide-y divide-outline-gray-1 rounded-4 border border-outline-gray-2">
            <li class="px-3 py-2 text-base text-ink-gray-8">Website redesign</li>
            <li class="px-3 py-2 text-base text-ink-gray-8">Mobile app</li>
            <li class="px-3 py-2 text-base text-ink-gray-8">Data migration</li>
            <li class="px-3 py-2 text-base text-ink-gray-8">SEO audit</li>
          </ul>
        </LoadingOverlay>
      </div>
    `,
  }),
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Active: Story = { args: { active: true } };
