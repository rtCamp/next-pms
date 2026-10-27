<script setup lang="ts">
import { computed } from "vue";
import type { UtilisationSegment } from "./utilisation";

const SIZE = 130;
const THICKNESS = 16;
/** Gap between adjacent arcs, in degrees. */
const GAP = 4;
const OUTER = SIZE / 2;
const INNER = OUTER - THICKNESS;

const props = defineProps<{ segments: UtilisationSegment[] }>();

const total = computed(() =>
  props.segments.reduce((sum, segment) => sum + segment.value, 0),
);

function point(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return `${OUTER + radius * Math.cos(radians)} ${OUTER + radius * Math.sin(radians)}`;
}

/** A ring sector from `start` to `end` degrees, clockwise from the top. */
function sector(start: number, end: number) {
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${point(OUTER, start)}`,
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${point(OUTER, end)}`,
    `L ${point(INNER, end)}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${point(INNER, start)}`,
    "Z",
  ].join(" ");
}

const ring = [OUTER, INNER]
  .map(
    (radius) =>
      `M ${OUTER - radius} ${OUTER} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0`,
  )
  .join(" ");

const arcs = computed(() => {
  let cursor = 0;
  return props.segments.flatMap((segment) => {
    const slot = (segment.value / total.value) * 360;
    const start = cursor + GAP / 2;
    const end = cursor + slot - GAP / 2;
    cursor += slot;
    return end > start
      ? [{ key: segment.key, d: sector(start, end), class: segment.fillClass }]
      : [];
  });
});
</script>

<template>
  <svg
    :width="SIZE"
    :height="SIZE"
    :viewBox="`0 0 ${SIZE} ${SIZE}`"
    class="shrink-0"
    role="img"
    :aria-label="
      segments.map((segment) => `${segment.label} ${segment.value}%`).join(', ')
    "
  >
    <path
      v-if="total <= 0"
      :d="ring"
      fill-rule="evenodd"
      class="fill-surface-gray-3"
    />
    <path
      v-for="arc in arcs"
      v-else
      :key="arc.key"
      :d="arc.d"
      :class="arc.class"
    />
  </svg>
</template>
