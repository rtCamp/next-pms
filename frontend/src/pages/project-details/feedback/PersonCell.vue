<script setup lang="ts">
import { Avatar } from "frappe-ui";

defineProps<{ name: string; image?: string | null }>();
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <Avatar size="xs" :label="name" :image="image ?? undefined" />
    <span class="truncate text-base text-ink-gray-6">{{ name }}</span>
  </div>
</template>
