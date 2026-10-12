<script setup lang="ts">
import { provide, toRef } from "vue";
import { Spinner } from "frappe-ui";
import CommentInput from "./CommentInput.vue";
import CommentThread from "./CommentThread.vue";
import { commentsContextKey } from "./context";
import type { CommentsProps } from "./types";

const props = withDefaults(defineProps<CommentsProps>(), {
  isLoading: false,
  isUpdating: false,
  canManageAllComments: false,
  title: "Comments",
  inputPlaceholder: "Type a comment",
  inputSubmitLabel: "Post",
});

defineSlots<{
  /** Replaces the default `<h2>` heading. */
  title?(): unknown;
}>();

provide(commentsContextKey, {
  mentions: toRef(props, "mentions"),
  isUpdating: toRef(props, "isUpdating"),
  authorId: toRef(props, "authorId"),
  canManageAllComments: toRef(props, "canManageAllComments"),
  replyToComment: (parentId, content) =>
    props.replyToComment(parentId, content),
  editComment: (commentId, content) => props.editComment(commentId, content),
  deleteComment: (commentId) => props.deleteComment(commentId),
});
</script>

<template>
  <section class="mt-6 flex flex-col gap-5 border-t border-outline-gray-2 pt-6">
    <slot name="title">
      <h2 class="text-lg font-medium text-ink-gray-8">{{ title }}</h2>
    </slot>

    <div v-if="isLoading" class="flex items-center justify-center py-6">
      <Spinner size="lg" class="text-ink-gray-5" />
    </div>
    <div v-else-if="comments.length" class="flex flex-col gap-3">
      <CommentThread
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
      />
    </div>

    <CommentInput
      :mentions="mentions"
      :placeholder="inputPlaceholder"
      :submit-label="inputSubmitLabel"
      collapsible
      reset-on-submit
      :is-submitting="isUpdating"
      :submit="addComment"
      :trigger-class="inputTriggerClass"
      :avatar-name="inputAvatarName"
      :avatar-image="inputAvatarImage"
    />
  </section>
</template>
