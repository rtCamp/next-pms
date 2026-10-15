<script setup lang="ts">
import { cva } from "class-variance-authority";
import type { PhaseIconProps } from "./types";

defineProps<PhaseIconProps>();

// frappe-ui has no ink shades for black, pink or purple, so they use the nearest hue.
const icon = cva("lucide-circle size-4 shrink-0", {
  variants: {
    color: {
      black: "text-ink-gray-9",
      gray: "text-ink-gray-4",
      blue: "text-ink-blue-3",
      green: "text-ink-green-3",
      red: "text-ink-red-3",
      pink: "text-ink-red-3",
      orange: "text-ink-orange-3",
      amber: "text-ink-amber-3",
      yellow: "text-ink-yellow-3",
      cyan: "text-ink-cyan-3",
      teal: "text-ink-teal-3",
      violet: "text-ink-violet-3",
      purple: "text-ink-violet-3",
    },
  },
  defaultVariants: { color: "gray" },
});
</script>

<template>
  <span aria-hidden="true" :class="icon({ color: color ?? 'gray' })" />
</template>
