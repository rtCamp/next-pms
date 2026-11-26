<script setup lang="ts">
import { computed, ref, useId } from "vue";
import CommentItem from "./CommentItem.vue";
import type { CommentNode } from "./types";

const MAX_COMMENT_DEPTH = 5;

const props = withDefaults(
  defineProps<{ comment: CommentNode; depth?: number }>(),
  { depth: 0 },
);

const replies = computed(() => props.comment.replies ?? []);
const canReply = computed(() => props.depth < MAX_COMMENT_DEPTH);

const open = ref(true);
const panelId = useId();
</script>

<template>
  <div class="flex flex-col gap-3">
    <CommentItem :comment="comment" :can-reply="canReply" />

    <div v-if="replies.length" class="flex flex-col pl-8">
      <div>
        <button
          type="button"
          class="inline-flex h-6 w-29 items-center justify-between gap-1 rounded-4 px-2 text-sm text-ink-gray-5 transition-colors hover:bg-surface-gray-2 hover:text-ink-gray-7"
          :aria-expanded="open"
          :aria-controls="panelId"
          @click="open = !open"
        >
          {{ open ? "Hide replies" : "Show replies" }}
          <span
            class="lucide-chevron-down size-4 shrink-0 transition-transform"
            :class="{ 'rotate-180': open }"
            aria-hidden="true"
          />
        </button>
      </div>
      <div
        v-show="open"
        :id="panelId"
        role="region"
        :aria-label="`Replies to ${comment.authorName}`"
        class="flex flex-col gap-3 pt-3"
      >
        <CommentThread
          v-for="reply in replies"
          :key="reply.id"
          :comment="reply"
          :depth="depth + 1"
        />
      </div>
    </div>
  </div>
</template>
