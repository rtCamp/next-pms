<script setup lang="ts">
import { InfoHoverCard } from "@/components/InfoHoverCard";
import { cn } from "@/utils/cn";
import LevelLabels from "./LevelLabels.vue";
import { ACTION_CELL_CLASS, CELL_CLASS } from "./constants";
import type { HeaderRowProps } from "./types";

defineProps<HeaderRowProps>();
</script>

<template>
  <div
    class="flex h-7 w-full items-center justify-between border-b border-outline-gray-1 px-1"
  >
    <div class="flex min-w-0 flex-1 items-center gap-1.5">
      <LevelLabels :levels="levels" variant="header" />
      <InfoHoverCard v-if="help" :help="help" />
    </div>
    <div
      v-for="(day, index) in days"
      :key="`${day}-${index}`"
      :class="[CELL_CLASS, 'text-sm text-ink-gray-5']"
    >
      {{ day }}
    </div>
    <div :class="[CELL_CLASS, 'text-sm text-ink-gray-5']">Total</div>
    <div :class="cn(ACTION_CELL_CLASS, 'justify-start')">
      <InfoHoverCard v-if="totalHelp" :help="totalHelp" />
    </div>
  </div>
</template>
