<script setup lang="ts">
import { computed } from "vue";
import type { ProgressBarProps, ProgressBarSize } from "./types";

const props = withDefaults(defineProps<ProgressBarProps>(), {
  maxValue: 100,
  size: "md",
});

const SIZES: Record<ProgressBarSize, string> = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const clamp = (v: number) => Math.max(0, Math.min(props.maxValue, v));
const percent = (v: number) =>
  props.maxValue > 0 ? (clamp(v) / props.maxValue) * 100 : 0;

interface Segment {
  part: "primary" | "secondary";
  width: number;
  class: string;
}

// The longer fill is drawn first so the shorter one stays visible on top.
// The defaults depend on draw order, matching the React component.
const segments = computed<Segment[]>(() => {
  const primary = percent(props.value);
  const secondary =
    props.secondaryValue === undefined
      ? undefined
      : percent(props.secondaryValue);
  const primaryClass = (fallback: string) => props.indicatorClass ?? fallback;
  const secondaryClass = (fallback: string) =>
    props.secondaryIndicatorClass ?? fallback;

  if (secondary !== undefined && secondary > primary) {
    return [
      {
        part: "secondary",
        width: secondary,
        class: secondaryClass("bg-surface-gray-6"),
      },
      {
        part: "primary",
        width: primary,
        class: primaryClass("bg-surface-gray-7"),
      },
    ];
  }
  const back: Segment = {
    part: "primary",
    width: primary,
    class: primaryClass("bg-surface-gray-6"),
  };
  if (secondary === undefined) return [back];
  return [
    back,
    {
      part: "secondary",
      width: secondary,
      class: secondaryClass("bg-surface-gray-7"),
    },
  ];
});

const marker = computed(() => {
  const m = props.markerValue;
  if (m === undefined || m <= 0 || m >= props.maxValue) return undefined;
  return (m / props.maxValue) * 100;
});
</script>

<template>
  <div
    role="progressbar"
    aria-valuemin="0"
    :aria-valuemax="maxValue"
    :aria-valuenow="clamp(value)"
    class="relative w-full overflow-hidden rounded-full bg-surface-gray-2"
    :class="SIZES[size] ?? SIZES.md"
  >
    <div
      v-for="segment in segments"
      :key="segment.part"
      :data-part="segment.part"
      class="absolute inset-y-0 left-0"
      :class="segment.class"
      :style="{ width: `${segment.width}%` }"
    />
    <div
      v-if="marker !== undefined"
      data-part="marker"
      aria-hidden="true"
      class="absolute inset-y-0 w-0.5 -translate-x-1/2"
      :class="markerClass ?? 'bg-surface-gray-3'"
      :style="{ left: `${marker}%` }"
    />
  </div>
</template>
