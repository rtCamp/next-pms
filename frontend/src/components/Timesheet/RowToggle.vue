<script setup lang="ts">
defineProps<{
  /** Accessible name, e.g. "Toggle This Week". */
  label: string;
  collapsed: boolean;
}>();
</script>

<!-- The click bubbles to the row, which does the toggling. -->
<template>
  <button
    type="button"
    class="flex size-4 shrink-0 items-center justify-center rounded-4 text-ink-gray-8"
    :aria-label="label"
    :aria-expanded="!collapsed"
  >
    <span
      class="lucide-chevron-down size-4 transition-transform"
      :class="collapsed ? '-rotate-90' : 'rotate-0'"
      aria-hidden="true"
    />
  </button>
</template>
