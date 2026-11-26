<script setup lang="ts">
import { FormLabel } from "frappe-ui";

defineProps<{ label: string }>();
defineSlots<{ default: () => unknown }>();
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <FormLabel :label="label" />
    <div
      class="flex h-8 items-center gap-1 rounded-4 border border-outline-gray-2 bg-surface-gray-1 px-2.5 text-ink-gray-5"
      :aria-label="label"
      role="group"
    >
      <slot />
    </div>
  </div>
</template>
