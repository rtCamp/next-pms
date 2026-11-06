<script setup lang="ts">
import { InfoHoverCard } from "@/components/InfoHoverCard";

defineProps<{
  /** A `lucide-*` icon class. */
  icon: string;
  /** Shown in a tooltip from an info icon after the text. */
  tooltip?: string;
}>();

defineSlots<{ default: () => unknown }>();
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      :class="icon"
      class="size-4 shrink-0 text-ink-gray-6"
      aria-hidden="true"
    />
    <span class="truncate text-sm text-ink-gray-6"><slot /></span>
    <InfoHoverCard v-if="tooltip" :tooltip="tooltip" />
  </div>
</template>
