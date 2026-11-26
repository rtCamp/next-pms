<script setup lang="ts">
import { Spinner } from "frappe-ui";
import type { LoadingOverlayProps } from "./types";

defineProps<LoadingOverlayProps>();
defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col" :aria-busy="active">
    <div
      class="flex min-h-0 flex-1 flex-col"
      :class="{ 'opacity-50 transition-opacity duration-150': active }"
    >
      <slot />
    </div>
    <div
      v-if="active"
      class="absolute inset-0 flex cursor-wait items-center justify-center text-ink-gray-7"
    >
      <Spinner class="size-6" />
    </div>
  </div>
</template>
