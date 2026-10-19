<script setup lang="ts">
import { computed } from "vue";
import { toast, useCall } from "frappe-ui";
import { Comments, type CommentNode } from "@/components/Comments";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import { errorMessage } from "@/utils/errors";
import { RAG_API } from "./constants";
import type { RagComment } from "./types";

const props = defineProps<{
  comments: RagComment[];
  isReloading: boolean;
  reload: () => Promise<unknown>;
}>();

const { projectId } = useProjectDetails();
const session = useSession();

function toCommentNode(comment: RagComment): CommentNode {
  return {
    id: comment.name,
    authorId: comment.user,
    authorName: comment.user_full_name,
    authorImage: comment.user_image,
    content: comment.comment,
    createdAt: comment.created_at,
    replies: comment.replies.map(toCommentNode),
  };
}

const nodes = computed(() => props.comments.map(toCommentNode));

interface EmployeeItem {
  employee_name: string;
  user_id?: string | null;
}

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

const addCall = useCall<unknown, Record<string, unknown>>({
  url: `${RAG_API}.add_project_rag_comment`,
  method: "POST",
  immediate: false,
});
const updateCall = useCall<unknown, Record<string, unknown>>({
  url: `${RAG_API}.update_project_rag_comment`,
  method: "POST",
  immediate: false,
});
const deleteCall = useCall<unknown, Record<string, unknown>>({
  url: `${RAG_API}.delete_project_rag_comment`,
  method: "POST",
  immediate: false,
});

const isUpdating = computed(
  () =>
    addCall.loading ||
    updateCall.loading ||
    deleteCall.loading ||
    props.isReloading,
);

async function write(
  call: { submit: (params: Record<string, unknown>) => Promise<unknown> },
  params: Record<string, unknown>,
) {
  try {
    await call.submit({ project: projectId.value, ...params });
  } catch (error) {
    toast.error(errorMessage(error));
    throw error;
  }
  await props.reload();
}
</script>

<template>
  <Comments
    :comments="nodes"
    :is-updating="isUpdating"
    :author-id="session.userId ?? undefined"
    :can-manage-all-comments="session.userId === 'Administrator'"
    :mentions="mentions"
    title="Comments"
    input-placeholder="Add a comment"
    input-submit-label="Post"
    :add-comment="(comment) => write(addCall, { comment })"
    :reply-to-comment="
      (parentId, comment) => write(addCall, { comment, reply_to: parentId })
    "
    :edit-comment="
      (commentName, comment) =>
        write(updateCall, { comment_name: commentName, comment })
    "
    :delete-comment="
      (commentName) => write(deleteCall, { comment_name: commentName })
    "
  />
</template>
