import { computed } from "vue";
import { toast, useCall } from "frappe-ui";
import type { CommentNode, CommentsProps } from "@/components/Comments";
import { useSession } from "@/session";
import { errorMessage } from "@/utils/errors";

/** A comment as the project comment endpoints return it, with its replies nested. */
export interface ProjectComment {
  name: string;
  user: string;
  user_full_name: string;
  user_image: string | null;
  comment: string;
  reply_to: string | null;
  created_at: string;
  modified_at: string | null;
  edited?: boolean;
  deleted?: boolean;
  deleted_at?: string | null;
  reply_count: number;
  replies: ProjectComment[];
}

type Params = Record<string, unknown>;

/** A write endpoint and the params it sends on top of the comment's own. */
export interface CommentWrite {
  url: string;
  params?: () => Params;
}

/** The list endpoint to fetch, or the comments a caller already fetched. */
export type CommentList =
  | { url: string; params: () => Params }
  | {
      comments: () => ProjectComment[];
      loading: () => boolean;
      reload: () => Promise<unknown>;
    };

export interface ProjectCommentsOptions {
  list: CommentList;
  /** Receives `comment`, plus `reply_to` for a reply. */
  add: CommentWrite;
  /** Receives `comment_name` and `comment`. */
  update: CommentWrite;
  /** Receives `comment_name`. */
  delete: CommentWrite;
}

interface EmployeeItem {
  employee_name: string;
  user_id?: string | null;
}

export function toCommentNode(comment: ProjectComment): CommentNode {
  return {
    id: comment.name,
    authorId: comment.user,
    authorName: comment.user_full_name,
    authorImage: comment.user_image,
    content: comment.comment,
    createdAt: comment.created_at,
    ownerId: comment.user,
    edited: comment.edited,
    deleted: comment.deleted,
    deletedAt: comment.deleted_at,
    replies: (comment.replies ?? []).map(toCommentNode),
  };
}

function useCommentList(list: CommentList) {
  if ("comments" in list) {
    return {
      comments: computed(list.comments),
      isLoading: computed(() => false),
      isReloading: computed(list.loading),
      error: computed(() => null),
      reload: list.reload,
    };
  }
  const call = useCall<ProjectComment[], Params>({
    url: list.url,
    params: list.params,
    refetch: true,
  });
  return {
    comments: computed(() => call.data ?? []),
    isLoading: computed(() => call.loading && !call.data),
    isReloading: computed(() => call.loading),
    error: computed(() => call.error),
    reload: () => call.reload(),
  };
}

/**
 * Wires a comment thread's endpoints to `<Comments>`: lists the comments (or takes
 * them from the caller), writes through the add, update and delete endpoints and
 * reloads the list after each write, toasts a failed write, and offers the
 * employees with a user as mentions. Bind `commentProps` to `<Comments>`.
 */
export function useProjectComments(options: ProjectCommentsOptions) {
  const session = useSession();
  const list = useCommentList(options.list);

  // React searched on every keystroke; Comments filters one list instead.
  const employees = useCall<{ data: EmployeeItem[] }>({
    url: "/api/v2/method/next_pms.timesheet.api.employee.get_employee_list",
  });
  const mentions = computed(() =>
    (employees.data?.data ?? [])
      .filter((employee) => employee.user_id)
      .map((employee) => ({
        label: employee.employee_name,
        value: employee.user_id!,
      })),
  );

  const writeCall = (write: CommentWrite) =>
    useCall<unknown, Params>({
      url: write.url,
      method: "POST",
      immediate: false,
    });
  const addCall = writeCall(options.add);
  const updateCall = writeCall(options.update);
  const deleteCall = writeCall(options.delete);

  async function write(
    call: typeof addCall,
    endpoint: CommentWrite,
    params: Params,
  ) {
    try {
      await call.submit({ ...endpoint.params?.(), ...params });
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
    await list.reload();
  }

  const commentProps = computed(
    (): Omit<
      CommentsProps,
      "title" | "inputPlaceholder" | "inputSubmitLabel"
    > => ({
      comments: list.comments.value.map(toCommentNode),
      isLoading: list.isLoading.value,
      isUpdating:
        addCall.loading ||
        updateCall.loading ||
        deleteCall.loading ||
        list.isReloading.value,
      authorId: session.userId ?? undefined,
      canManageAllComments: session.userId === "Administrator",
      mentions: mentions.value,
      addComment: (comment) => write(addCall, options.add, { comment }),
      replyToComment: (parentId, comment) =>
        write(addCall, options.add, { comment, reply_to: parentId }),
      editComment: (commentName, comment) =>
        write(updateCall, options.update, {
          comment_name: commentName,
          comment,
        }),
      deleteComment: (commentName) =>
        write(deleteCall, options.delete, { comment_name: commentName }),
    }),
  );

  return { commentProps, error: list.error, reload: list.reload };
}
