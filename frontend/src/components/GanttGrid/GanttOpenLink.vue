<script setup lang="ts">
defineProps<{
  href: string;
  /** e.g. "Open project". */
  label: string;
}>();
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noreferrer"
    :aria-label="label"
    class="shrink-0 rounded-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
    @click.stop
  >
    <span
      class="lucide-arrow-up-right block size-4 shrink-0 text-ink-gray-8"
      aria-hidden="true"
    />
  </a>
</template>
