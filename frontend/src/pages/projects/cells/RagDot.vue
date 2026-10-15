<script setup lang="ts">
import { computed } from "vue";
import { cva } from "class-variance-authority";
import { RAG_STATUSES } from "../constants";
import type { RagStatus } from "../types";

const props = defineProps<{ status?: string | null }>();

const dot = cva("size-2 shrink-0 rounded-full bg-current", {
  variants: {
    status: {
      red: "text-ink-red-3",
      amber: "text-ink-amber-3",
      green: "text-ink-green-3",
    },
  },
});

const rag = computed(() => {
  const status = props.status?.toLowerCase();
  return RAG_STATUSES.find((known) => known === status) as
    RagStatus | undefined;
});
</script>

<template>
  <span v-if="rag" class="flex size-4 shrink-0 items-center justify-center">
    <span
      role="img"
      :aria-label="`RAG status: ${rag}`"
      :class="dot({ status: rag })"
    />
  </span>
</template>
