<script setup lang="ts">
import { cva } from "class-variance-authority";
import type { PhaseIconProps } from "./types";

defineProps<PhaseIconProps>();

// Black has no ink shade; purple shows violet, as Close Out did in React.
const icon = cva("lucide-circle size-4 shrink-0", {
  variants: {
    color: {
      black: "text-ink-gray-9",
      gray: "text-ink-gray-4",
      blue: "text-ink-blue-6",
      green: "text-ink-green-6",
      red: "text-ink-red-6",
      pink: "text-ink-pink-6",
      orange: "text-ink-orange-6",
      amber: "text-ink-amber-6",
      yellow: "text-ink-yellow-6",
      cyan: "text-ink-cyan-6",
      teal: "text-ink-teal-6",
      violet: "text-ink-violet-6",
      purple: "text-ink-violet-6",
    },
  },
  defaultVariants: { color: "gray" },
});
</script>

<template>
  <span aria-hidden="true" :class="icon({ color: color ?? 'gray' })" />
</template>
