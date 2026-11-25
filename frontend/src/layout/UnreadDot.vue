<script setup lang="ts">
import { cva } from "class-variance-authority";

defineProps<{ placement: "logo" | "menuItem" }>();

const dot = cva("shrink-0 rounded-full bg-surface-blue-7", {
  variants: {
    placement: {
      logo: "absolute right-1 top-1 size-[9px] ring-2 ring-[var(--surface-sidebar)]",
      menuItem: "size-[7px]",
    },
  },
});
</script>

<template>
  <span aria-hidden="true" :class="dot({ placement })" />
</template>
