<script setup lang="ts">
import LevelLabels from "./LevelLabels.vue";
import { ACTION_CELL_CLASS, CELL_CLASS } from "./constants";
import type { HeaderRowProps } from "./types";

defineProps<HeaderRowProps>();
</script>

<template>
  <div
    class="flex h-7 w-full items-center justify-between border-b border-outline-gray-1 px-1"
  >
    <div class="flex min-w-0 flex-1 items-center">
      <LevelLabels :levels="levels" variant="header" />
    </div>
    <div
      v-for="(day, index) in days"
      :key="`${day}-${index}`"
      :class="[CELL_CLASS, 'text-sm text-ink-gray-5']"
    >
      {{ day }}
    </div>
    <div :class="[CELL_CLASS, 'text-sm text-ink-gray-5']">Total</div>
    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
