<script setup lang="ts">
import { computed } from "vue";
import { STATUS_DOT_CLASS } from "./constants";

const props = defineProps<{ status?: string | null }>();

const dotClass = computed(() => STATUS_DOT_CLASS[props.status ?? ""] ?? "");
</script>

<template>
  <span v-if="!status">—</span>
  <span v-else class="flex min-w-0 items-center gap-2">
    <span
      class="relative size-3.5 shrink-0 rounded-full"
      :class="dotClass"
      aria-hidden="true"
    >
      <span
        class="absolute inset-0 m-auto size-1.5 rounded-full bg-surface-base"
      />
    </span>
    <span class="truncate">{{ status }}</span>
  </span>
</template>
