<script setup lang="ts">
import { computed } from "vue";
import { cva } from "class-variance-authority";
import type { TaskProgressProps } from "./types";

const props = withDefaults(defineProps<TaskProgressProps>(), {
  size: "md",
  label: "Task progress",
});

const MAX_VALUE = 100;

const track = cva("flex rounded-1 bg-surface-gray-2", {
  variants: { size: { sm: "h-2", md: "h-4" } },
  defaultVariants: { size: "md" },
});

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
    :aria-label="label"
    aria-valuemin="0"
    :aria-valuemax="MAX_VALUE"
    :aria-valuenow="Math.min(MAX_VALUE, value)"
    :aria-valuetext="`${Math.round(value)}%`"
    :class="track({ size })"
  >
    <div
      class="h-full rounded-l-1 bg-surface-gray-4"
      :style="{ width: `${baseWidth}%` }"
    />
    <div
      v-if="isOverflow"
      class="relative h-full rounded-r-1 bg-surface-red-8 before:absolute before:bottom-0 before:left-0 before:h-[160%] before:w-0 before:border-l before:border-outline-gray-7 before:content-['']"
      :style="{ width: `${overflowWidth}%` }"
    />
  </div>
</template>
