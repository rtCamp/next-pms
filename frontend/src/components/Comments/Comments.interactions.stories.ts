import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import Comments from "./Comments.vue";
import visual from "./Comments.stories";

const meta = {
  ...visual,
  title: "Components/Comments/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof Comments>;

export default meta;
type Story = StoryObj<typeof meta>;

const commentBy = (canvasElement: HTMLElement, name: string, index = 0) =>
  within(canvasElement).getAllByRole("article", {
    name: `Comment by ${name}`,
  })[index];

export const OwnAndOthersComments: Story = {
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

export const AddComment: Story = {
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
