<script setup lang="ts">
defineProps<{ icon?: string | null }>();
</script>

<template>
  <span
    v-if="icon?.startsWith('lucide-')"
    class="size-4 shrink-0"
    :class="icon"
    aria-hidden="true"
  />
  <span
    v-else-if="icon"
    class="flex size-4 shrink-0 items-center justify-center text-base leading-none"
    aria-hidden="true"
    >{{ icon }}</span
  >
</template>
