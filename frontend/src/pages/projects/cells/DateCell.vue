<script setup lang="ts">
import { formatProjectDate } from "@/utils/date";

defineProps<{ date: string | null }>();
</script>

<template>
  <span
    v-if="date"
    class="inline-flex min-w-0 items-center gap-1.5 text-base text-ink-gray-6"
  >
    <span class="lucide-calendar-clock size-4 shrink-0" aria-hidden="true" />
    <span class="truncate">{{ formatProjectDate(date) }}</span>
  </span>
  <span v-else class="block truncate text-base text-ink-gray-6">N/A</span>
</template>
