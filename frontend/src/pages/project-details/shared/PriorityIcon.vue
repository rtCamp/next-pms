<script setup lang="ts">
import { computed } from "vue";
import { priorityBars } from "./priority";

const props = defineProps<{ level: string }>();

const BARS = [
  { x: 3.25, y: 10, height: 4 },
  { x: 7.25, y: 6, height: 8 },
  { x: 11.25, y: 2, height: 12 },
];
const solid = computed(() => priorityBars(props.level));
</script>

<template>
  <svg viewBox="0 0 16 16" class="size-3.5 shrink-0" aria-hidden="true">
    <rect
      v-for="(bar, index) in BARS"
      :key="bar.x"
      :x="bar.x"
      :y="bar.y"
      width="1.5"
      :height="bar.height"
      rx="0.5"
      fill="currentColor"
      :fill-opacity="index < solid ? 1 : 0.4"
    />
  </svg>
</template>
