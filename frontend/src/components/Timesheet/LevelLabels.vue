<script setup lang="ts">
defineProps<{
  levels: string[];
  /** `header` for the grid's header row, `total` for a total row. */
  variant: "header" | "total";
}>();
</script>

<template>
  <span
    class="flex min-w-0 items-center truncate"
    :class="
      variant === 'header'
        ? 'pl-2 text-sm text-ink-gray-5'
        : 'text-base-medium text-ink-gray-9'
    "
  >
    <template v-for="(level, index) in levels" :key="level">
      <span
        v-if="index > 0"
        class="mx-1"
        :class="variant === 'header' && 'text-ink-gray-4'"
        aria-hidden="true"
      >
        /
      </span>
      <span>{{ level }}</span>
    </template>
  </span>
</template>
