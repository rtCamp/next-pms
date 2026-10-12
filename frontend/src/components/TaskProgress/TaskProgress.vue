<script setup lang="ts">
import { computed } from "vue";
import type { TaskProgressProps, TaskProgressSize } from "./types";

const props = withDefaults(defineProps<TaskProgressProps>(), { size: "md" });

const MAX_VALUE = 100;

const SIZES: Record<TaskProgressSize, string> = { sm: "h-2", md: "h-4" };

const value = computed(() => Math.max(0, props.value));
const isOverflow = computed(() => value.value > MAX_VALUE);
// Past 100% the bar rescales so 100% sits at the divider and the
// overflow fills the rest of the track.
const baseWidth = computed(() =>
  isOverflow.value ? (MAX_VALUE / value.value) * 100 : value.value,
);
const overflowWidth = computed(() =>
  isOverflow.value ? ((value.value - MAX_VALUE) / value.value) * 100 : 0,
);
</script>

<template>
  <div
    role="progressbar"
    aria-valuemin="0"
    :aria-valuemax="MAX_VALUE"
    :aria-valuenow="Math.min(MAX_VALUE, value)"
    :aria-valuetext="`${Math.round(value)}%`"
    class="flex rounded-sm bg-surface-gray-2"
    :class="SIZES[size] ?? SIZES.md"
  >
    <div
      data-part="base"
      class="h-full rounded-l-sm bg-surface-gray-4"
      :style="{ width: `${baseWidth}%` }"
    />
    <div
      v-if="isOverflow"
      data-part="overflow"
      class="relative h-full rounded-r-sm bg-surface-red-6 before:absolute before:bottom-0 before:left-0 before:h-[160%] before:w-0 before:border-l before:border-outline-gray-5 before:content-['']"
      :style="{ width: `${overflowWidth}%` }"
    />
  </div>
</template>
