<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { Button } from "frappe-ui";
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
        <Button
          variant="ghost"
          size="sm"
          :label="open ? 'Hide replies' : 'Show replies'"
          :icon-right="open ? 'lucide-chevron-up' : 'lucide-chevron-down'"
          :aria-expanded="open"
          :aria-controls="panelId"
          @click="open = !open"
        />
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
