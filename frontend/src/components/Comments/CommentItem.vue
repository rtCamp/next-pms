<script setup lang="ts">
import { computed, ref } from "vue";
import { Avatar, dialog } from "frappe-ui";
import { CommentKit, Editor, EditorContent } from "frappe-ui/editor";
import { formatRelativeTimeShort } from "@/utils/text";
import CommentActions from "./CommentActions.vue";
import CommentInput from "./CommentInput.vue";
import { useCommentsContext } from "./context";
import type { CommentNode } from "./types";

const props = defineProps<{ comment: CommentNode; canReply: boolean }>();

const ctx = useCommentsContext();
const readOnlyExtensions = [CommentKit];

const isEditing = ref(false);
const isReplying = ref(false);

const authorHref = computed(
  () => `/desk/user/${encodeURIComponent(props.comment.authorId)}`,
);
const timestamp = computed(() =>
  formatRelativeTimeShort(props.comment.createdAt, new Date(), true),
);
const isOwnedByViewer = computed(() => {
  const viewer = ctx.authorId.value;
  return (
    Boolean(viewer) &&
    (props.comment.authorId === viewer || props.comment.ownerId === viewer)
  );
});
const canManage = computed(
  () =>
    (isOwnedByViewer.value || ctx.canManageAllComments.value) &&
    !props.comment.deleted,
);
const status = computed(() =>
  props.comment.deleted
    ? "deleted"
    : props.comment.edited
      ? "edited"
      : "added a comment",
);
const body = computed(() =>
  props.comment.deleted
    ? "<p>This comment has been deleted.</p>"
    : props.comment.content,
);

async function saveEdit(content: string) {
  await ctx.editComment(props.comment.id, content);
  isEditing.value = false;
}

async function postReply(content: string) {
  await ctx.replyToComment(props.comment.id, content);
  isReplying.value = false;
}

function confirmDelete() {
  dialog.danger({
    title: "Delete comment",
    message:
      "Are you sure you want to delete this comment? This action cannot be undone.",
    confirmLabel: "Delete",
    onConfirm: () => ctx.deleteComment(props.comment.id),
  });
}
</script>

<template>
  <article
    class="flex flex-col gap-2"
    :aria-label="`Comment by ${comment.authorName}`"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <a
          :href="authorHref"
          class="flex shrink-0 items-center"
          :aria-label="comment.authorName"
        >
          <Avatar
            size="sm"
            shape="circle"
            :label="comment.authorName"
            :image="comment.authorImage || undefined"
          />
        </a>
        <span class="truncate text-base font-medium text-ink-gray-7">
          {{ comment.authorName }}
        </span>
        <span class="shrink-0 text-base text-ink-gray-5">{{ status }}</span>
      </div>
      <time
        class="shrink-0 text-sm text-ink-gray-5"
        :datetime="comment.createdAt"
      >
        {{ timestamp }}
      </time>
    </div>

    <CommentInput
      v-if="isEditing"
      :mentions="ctx.mentions.value"
      :initial-value="comment.content"
      placeholder="Edit comment"
      autofocus
      cancellable
      :is-submitting="ctx.isUpdating.value"
      submit-label="Save"
      :submit="saveEdit"
      @cancel="isEditing = false"
    />
    <div v-else class="rounded-lg bg-surface-gray-1 px-3">
      <Editor
        :model-value="body"
        :extensions="readOnlyExtensions"
        :editable="false"
      >
        <EditorContent class="prose-sm text-ink-gray-7" />
      </Editor>
    </div>

    <CommentActions
      v-if="!isEditing"
      :can-reply="canReply"
      :can-edit="canManage"
      :can-delete="canManage"
      :is-replying="isReplying"
      :is-updating="ctx.isUpdating.value"
      @reply="isReplying = !isReplying"
      @edit="isEditing = true"
      @delete="confirmDelete"
    />

    <CommentInput
      v-if="isReplying"
      :mentions="ctx.mentions.value"
      placeholder="Type a reply"
      autofocus
      cancellable
      :is-submitting="ctx.isUpdating.value"
      submit-label="Post"
      :submit="postReply"
      @cancel="isReplying = false"
    />
  </article>
</template>
