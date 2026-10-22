<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <div class="flex items-center gap-4 py-1">
    <span class="w-28 shrink-0 text-base text-ink-gray-6">{{ label }}</span>
    <div
      class="flex min-w-0 flex-1 items-center gap-2 px-2 text-base text-ink-gray-6"
    >
      <slot />
    </div>
  </div>
</template>
