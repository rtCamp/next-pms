<script setup lang="ts">
defineProps<{
  /** A `lucide-*` icon class. */
  icon: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 py-24 text-center"
  >
    <div class="rounded-full bg-surface-gray-2 p-3 text-ink-gray-5">
      <span :class="[icon, 'size-6']" aria-hidden="true" />
    </div>
    <h1 class="text-base text-ink-gray-7">{{ title }}</h1>
    <p v-if="description" class="text-sm text-ink-gray-5">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-2 flex gap-2">
      <slot />
    </div>
  </div>
</template>
