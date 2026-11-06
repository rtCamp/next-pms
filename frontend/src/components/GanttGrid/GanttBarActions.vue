<script setup lang="ts">
import { BAR_HEIGHT, CELL_HEIGHT } from "./constants";

defineProps<{
  /** The bar's geometry; the buttons line up under its right end. */
  left: number;
  width: number;
}>();

defineSlots<{ default: () => unknown }>();
</script>

<template>
  <div
    class="pointer-events-none absolute z-20 flex"
    :style="{
      left: `${left}px`,
      width: `${width}px`,
      top: `${(CELL_HEIGHT + BAR_HEIGHT) / 2 + 4}px`,
    }"
  >
    <div
      class="pointer-events-auto ml-auto flex w-max items-center gap-1 whitespace-nowrap text-sm-medium text-ink-gray-6"
    >
      <slot />
    </div>
  </div>
</template>
