<script setup lang="ts">
import { computed } from "vue";
import { STATUS_DOT_CLASS } from "./constants";

const props = defineProps<{ status?: string | null }>();

// As React: an unknown status gets Ideation's grey dot.
const dotClass = computed(
  () => STATUS_DOT_CLASS[props.status ?? ""] ?? STATUS_DOT_CLASS.Ideation,
);
</script>

<template>
  <span v-if="!status">—</span>
  <span v-else class="flex min-w-0 items-center gap-2">
    <svg
      viewBox="0 0 16 16"
      class="size-4 shrink-0"
      :class="dotClass"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3.5" fill="currentColor" />
    </svg>
    <span class="truncate">{{ status }}</span>
  </span>
</template>
