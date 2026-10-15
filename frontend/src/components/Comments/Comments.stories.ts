import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import Comments from "./Comments.vue";
import { PEOPLE, THREAD, VIEWER } from "./Comments.fixtures";

const meta = {
  title: "Components/Comments",
  component: Comments,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    comments: THREAD,
    authorId: VIEWER,
    mentions: PEOPLE,
    addComment: fn(async () => {}),
    replyToComment: fn(async () => {}),
    editComment: fn(async () => {}),
    deleteComment: fn(async () => {}),
  },
  render: (args) => ({
    components: { Comments },
    setup: () => ({ args }),
    template: `<div class="max-w-2xl"><Comments v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof Comments>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreadWithReplies: Story = {};

export const Empty: Story = { args: { comments: [] } };

export const Loading: Story = { args: { isLoading: true } };

export const Updating: Story = { args: { isUpdating: true } };

export const WithInputAvatar: Story = {
  args: {
    comments: [],
    title: "Feedback comments",
    inputPlaceholder: "Add a comment",
    inputAvatarName: "Jane Doe",
  },
};

export const CustomTitle: Story = {
  render: (args) => ({
    components: { Comments },
    setup: () => ({ args }),
    template: `
      <div class="max-w-2xl">
        <Comments v-bind="args" class="!mt-0 !border-none !pt-0">
          <template #title>
            <h3 class="text-xl font-semibold text-ink-gray-7">Comments</h3>
          </template>
        </Comments>
      </div>
    `,
  }),
};
