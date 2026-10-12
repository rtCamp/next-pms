import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import Comments from "./Comments.vue";
import type { CommentMention, CommentNode } from "./types";

const VIEWER = "jane@example.com";

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const people: CommentMention[] = [
  { label: "Jane Doe", value: "jane@example.com" },
  { label: "Arjun Mehta", value: "arjun@example.com" },
  { label: "Priya Shah", value: "priya@example.com" },
];

const thread: CommentNode[] = [
  {
    id: "c1",
    authorId: "arjun@example.com",
    authorName: "Arjun Mehta",
    content:
      "<p>Budget burn is ahead of plan this sprint. Can we review the remaining scope?</p>",
    createdAt: ago(60 * 26),
    replies: [
      {
        id: "c2",
        authorId: VIEWER,
        authorName: "Jane Doe",
        content:
          '<p>Agreed. <span class="mention" data-type="mention" data-id="priya@example.com" data-label="Priya Shah">@Priya Shah</span> can you share the estimate?</p>',
        createdAt: ago(60 * 5),
        edited: true,
        replies: [
          {
            id: "c3",
            authorId: "priya@example.com",
            authorName: "Priya Shah",
            content: "<p>Will do by tomorrow.</p>",
            createdAt: ago(40),
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "c4",
    authorId: VIEWER,
    authorName: "Jane Doe",
    content: "<p>Client confirmed the new <strong>launch date</strong>.</p>",
    createdAt: ago(3),
    replies: [],
  },
  {
    id: "c5",
    authorId: "priya@example.com",
    authorName: "Priya Shah",
    content: "",
    createdAt: ago(60 * 24 * 10),
    deleted: true,
    replies: [],
  },
];

const meta = {
  title: "Components/Comments",
  component: Comments,
  tags: ["autodocs"],
  args: {
    comments: thread,
    authorId: VIEWER,
    mentions: people,
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

const commentBy = (canvasElement: HTMLElement, name: string, index = 0) =>
  within(canvasElement).getAllByRole("article", {
    name: `Comment by ${name}`,
  })[index];

export const ThreadWithReplies: Story = {};

export const Empty: Story = { args: { comments: [] } };

export const Loading: Story = { args: { isLoading: true } };

export const OwnAndOthersComments: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const others = commentBy(canvasElement, "Arjun Mehta");
    await expect(
      within(others).getByRole("button", { name: "Reply" }),
    ).toBeInTheDocument();
    await expect(
      within(others).queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    await expect(
      within(others).queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();

    const own = commentBy(canvasElement, "Jane Doe", 1);
    await expect(
      within(own).getByRole("button", { name: "Edit" }),
    ).toBeInTheDocument();
    await expect(
      within(own).getByRole("button", { name: "Delete" }),
    ).toBeInTheDocument();

    const deleted = commentBy(canvasElement, "Priya Shah", 1);
    await expect(deleted).toHaveTextContent("This comment has been deleted.");
    await expect(
      within(deleted).queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
  },
};

export const CanManageAllComments: Story = {
  tags: ["interaction"],
  args: { canManageAllComments: true },
  play: async ({ canvasElement }) => {
    const others = commentBy(canvasElement, "Arjun Mehta");
    await expect(
      within(others).getByRole("button", { name: "Edit" }),
    ).toBeInTheDocument();
    await expect(
      within(others).getByRole("button", { name: "Delete" }),
    ).toBeInTheDocument();
  },
};

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

export const AddComment: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("textbox", { name: "Type a comment" }),
    );

    const editor = await waitFor(() => {
      const el = canvas.getByRole("textbox", { name: "Type a comment" });
      expect(el).toHaveAttribute("contenteditable", "true");
      return el;
    });
    const post = canvas.getByRole("button", { name: "Post" });
    await expect(post).toBeDisabled();

    await userEvent.click(editor);
    await userEvent.type(editor, "Looks good to me");
    await waitFor(() => expect(post).toBeEnabled());
    await userEvent.click(post);

    await waitFor(() =>
      expect(args.addComment).toHaveBeenCalledWith(
        expect.stringContaining("Looks good to me"),
      ),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Type a comment" }),
      ).not.toHaveAttribute("contenteditable"),
    );
  },
};

export const AddCommentFailure: Story = {
  tags: ["interaction"],
  args: { addComment: fn(async () => Promise.reject(new Error("Network"))) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("textbox", { name: "Type a comment" }),
    );
    const editor = await waitFor(() => {
      const el = canvas.getByRole("textbox", { name: "Type a comment" });
      expect(el).toHaveAttribute("contenteditable", "true");
      return el;
    });
    await userEvent.click(editor);
    await userEvent.type(editor, "Keep me");
    await userEvent.click(canvas.getByRole("button", { name: "Post" }));

    await waitFor(() => expect(args.addComment).toHaveBeenCalled());
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Post" })).toBeEnabled(),
    );
    await expect(
      canvas.getByRole("textbox", { name: "Type a comment" }),
    ).toHaveTextContent("Keep me");
  },
};

export const CancelNewComment: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("textbox", { name: "Type a comment" }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Cancel" }),
    );
    await expect(
      canvas.getByRole("textbox", { name: "Type a comment" }),
    ).not.toHaveAttribute("contenteditable");
    await expect(args.addComment).not.toHaveBeenCalled();
  },
};

export const Reply: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const comment = commentBy(canvasElement, "Arjun Mehta");
    const replyButton = within(comment).getByRole("button", { name: "Reply" });
    await expect(replyButton).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(replyButton);
    await expect(replyButton).toHaveAttribute("aria-expanded", "true");

    const editor = await within(comment).findByRole("textbox", {
      name: "Type a reply",
    });
    await userEvent.click(editor);
    await userEvent.type(editor, "On it");
    await userEvent.click(
      within(comment).getByRole("button", { name: "Post" }),
    );

    await waitFor(() =>
      expect(args.replyToComment).toHaveBeenCalledWith(
        "c1",
        expect.stringContaining("On it"),
      ),
    );
    await waitFor(() =>
      expect(
        within(comment).queryByRole("textbox", { name: "Type a reply" }),
      ).not.toBeInTheDocument(),
    );
  },
};

export const Edit: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const comment = commentBy(canvasElement, "Jane Doe", 1);
    await userEvent.click(
      within(comment).getByRole("button", { name: "Edit" }),
    );

    const editor = await within(comment).findByRole("textbox", {
      name: "Edit comment",
    });
    await waitFor(() => expect(editor).toHaveTextContent("launch date"));
    await expect(
      within(comment).queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();

    await userEvent.click(editor);
    await userEvent.type(editor, " Updated.", { skipClick: true });
    await userEvent.click(
      within(comment).getByRole("button", { name: "Save" }),
    );

    await waitFor(() =>
      expect(args.editComment).toHaveBeenCalledWith(
        "c4",
        expect.stringContaining("Updated."),
      ),
    );
    await waitFor(() =>
      expect(
        within(comment).getByRole("button", { name: "Edit" }),
      ).toBeInTheDocument(),
    );
  },
};

export const DeleteWithConfirm: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const comment = commentBy(canvasElement, "Jane Doe", 1);
    await userEvent.click(
      within(comment).getByRole("button", { name: "Delete" }),
    );

    const confirm = await screen.findByRole("dialog");
    await expect(confirm).toHaveTextContent("Delete comment");

    await userEvent.click(
      within(confirm).getByRole("button", { name: "Cancel" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await expect(args.deleteComment).not.toHaveBeenCalled();

    await userEvent.click(
      within(comment).getByRole("button", { name: "Delete" }),
    );
    const again = await screen.findByRole("dialog");
    await userEvent.click(
      within(again).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() => expect(args.deleteComment).toHaveBeenCalledWith("c4"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  },
};

export const ToggleReplies: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [toggle] = canvas.getAllByRole("button", { name: "Hide replies" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      canvas.getByRole("region", { name: "Replies to Arjun Mehta" }),
    ).toBeVisible();

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAccessibleName("Show replies");
    await expect(
      canvas.queryByRole("region", { name: "Replies to Arjun Mehta" }),
    ).not.toBeInTheDocument();
  },
};

export const MentionSuggestions: Story = {
  tags: ["interaction"],
  args: { comments: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("textbox", { name: "Type a comment" }),
    );
    const editor = await waitFor(() => {
      const el = canvas.getByRole("textbox", { name: "Type a comment" });
      expect(el).toHaveAttribute("contenteditable", "true");
      return el;
    });
    await userEvent.click(editor);
    await userEvent.type(editor, "@pri");
    await waitFor(() => expect(screen.getByText("Priya Shah")).toBeVisible());
    await expect(screen.queryByText("Arjun Mehta")).not.toBeInTheDocument();
  },
};
