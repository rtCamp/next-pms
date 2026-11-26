import type { HTMLAttributes } from "vue";
import type { MentionSuggestionItem } from "frappe-ui/editor";

/** A person offered in the editor's `@` list: `label` is shown, `value` (the user id) is stored. */
export type CommentMention = MentionSuggestionItem;

/** One comment and its replies, already mapped from the backend shape. */
export interface CommentNode {
  /** Unique id of the comment (the backend record name). */
  id: string;
  /** User id of the author; links to `/desk/user/<authorId>`. */
  authorId: string;
  /** Author's full name. */
  authorName: string;
  /** URL of the author's avatar image. */
  authorImage?: string | null;
  /** Comment body as HTML. */
  content: string;
  /** Creation time, as an ISO or Frappe datetime string. */
  createdAt: string;
  /** User id of the record owner, when it differs from the author. */
  ownerId?: string | null;
  /** Whether the comment was edited after posting. */
  edited?: boolean;
  /** Whether the comment was deleted; its body is replaced by a notice. */
  deleted?: boolean;
  /** When the comment was deleted. */
  deletedAt?: string | null;
  /** Direct replies, oldest first. */
  replies: CommentNode[];
}

export interface CommentsProps {
  /** Top-level comments, each with its reply tree. */
  comments: CommentNode[];
  /** Shows a spinner instead of the list. */
  isLoading?: boolean;
  /** Disables every action and input while a write is in flight. */
  isUpdating?: boolean;
  /** User id of the viewer; they can edit and delete their own comments. */
  authorId?: string;
  /** Lets the viewer edit and delete everyone's comments. */
  canManageAllComments?: boolean;
  /** Heading above the list. Use the `title` slot to render a different heading. */
  title?: string;
  /** Placeholder of the new-comment input. */
  inputPlaceholder?: string;
  /** Label of the new-comment submit button. */
  inputSubmitLabel?: string;
  /** Class for the collapsed new-comment input row (e.g. to make it sticky). */
  inputTriggerClass?: HTMLAttributes["class"];
  /** Name for the avatar beside the collapsed new-comment input. */
  inputAvatarName?: string;
  /** Image for the avatar beside the collapsed new-comment input. */
  inputAvatarImage?: string | null;
  /** People offered after typing `@` in any comment input; filtered by label as the user types. */
  mentions?: CommentMention[];
  /** Posts a new top-level comment. The input resets and collapses once it resolves. */
  addComment: (content: string) => Promise<void>;
  /** Posts a reply under `parentId`. The reply input closes once it resolves. */
  replyToComment: (parentId: string, content: string) => Promise<void>;
  /** Saves an edited comment. The edit input closes once it resolves. */
  editComment: (commentId: string, content: string) => Promise<void>;
  /** Deletes a comment after the user confirms. The dialog stays open, loading, until it settles. */
  deleteComment: (commentId: string) => Promise<void>;
}
