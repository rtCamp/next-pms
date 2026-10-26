<script setup lang="ts">
defineProps<{ title: string; link?: { label: string; href: string } }>();
</script>

<template>
  <section
    :aria-label="title"
    class="flex min-w-0 flex-1 flex-col gap-4 rounded-7 border border-outline-gray-1 bg-surface-elevation-1 p-3"
  >
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-base-medium leading-tighter text-ink-gray-8">
        {{ title }}
      </h3>
      <a
        v-if="link"
        :href="link.href"
        target="_blank"
        rel="noreferrer noopener"
        class="flex items-center gap-2 rounded-1 text-base leading-tighter text-ink-gray-6 hover:text-ink-gray-8"
      >
        {{ link.label }}
        <span class="lucide-arrow-up-right size-4" aria-hidden="true" />
      </a>
    </div>
    <slot />
  </section>
</template>
