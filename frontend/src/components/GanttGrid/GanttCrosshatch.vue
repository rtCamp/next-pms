<script setup lang="ts">
import { useId } from "vue";
import { cva } from "class-variance-authority";
import type { BarVariant } from "./GanttBar.vue";

defineProps<{ variant: BarVariant }>();

const hatch = cva(
  "pointer-events-none absolute inset-0 size-full overflow-hidden rounded-4 opacity-50 mix-blend-multiply",
  {
    variants: {
      variant: {
        full: "text-ink-green-6",
        under: "text-ink-amber-6",
        over: "text-ink-violet-5",
        timeoff: "text-ink-gray-6",
        projectSummary: "text-ink-blue-6",
        allocation: "text-ink-gray-5",
        aiAllocation: "text-ink-amber-6",
        draft: "",
        empty: "",
      },
    },
  },
);

// Each bar needs its own ids, or one bar's pattern can paint another.
const id = useId();
const patternId = `gantt-hatch-${id}`;
const fadeId = `gantt-hatch-fade-${id}`;
const maskId = `gantt-hatch-mask-${id}`;
</script>

<template>
  <svg
    :class="hatch({ variant })"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <pattern
        :id="patternId"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(30)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="5"
          stroke="currentColor"
          stroke-width="1"
          shape-rendering="geometricPrecision"
        />
      </pattern>
      <linearGradient :id="fadeId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="0" />
        <stop offset="50%" stop-color="white" stop-opacity="0" />
        <stop offset="76%" stop-color="white" stop-opacity="0.24" />
        <stop offset="100%" stop-color="white" stop-opacity="1" />
      </linearGradient>
      <mask :id="maskId">
        <rect width="100%" height="100%" :fill="`url(#${fadeId})`" />
      </mask>
    </defs>
    <rect
      width="100%"
      height="100%"
      :fill="`url(#${patternId})`"
      :mask="`url(#${maskId})`"
    />
  </svg>
</template>
