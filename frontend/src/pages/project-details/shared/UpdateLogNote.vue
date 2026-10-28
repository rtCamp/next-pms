<script setup lang="ts">
defineProps<{ message: string }>();
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-6 bg-surface-violet-2 px-2.5 py-2"
  >
    <span
      class="lucide-triangle-alert size-4 shrink-0 text-ink-violet-8"
      aria-hidden="true"
    />
    <p class="min-w-0 flex-1 text-left text-xs text-ink-gray-8">
      {{ message }}
    </p>
  </div>
</template>
