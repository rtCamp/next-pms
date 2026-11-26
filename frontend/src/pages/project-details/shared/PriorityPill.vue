<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/utils/cn";
import { isPriorityLevel, PRIORITY_INK, PRIORITY_SURFACE } from "./priority";
import PriorityIcon from "./PriorityIcon.vue";

const props = defineProps<{
  /** Low, Medium or High; another value shows uncoloured with all bars solid, as React. */
  level: string;
  /** The text beside the bars, e.g. "High risk". */
  label: string;
  /** Drops the tinted pill, for a value inside a field. */
  bare?: boolean;
}>();

const classes = computed(() => {
  const known = isPriorityLevel(props.level) ? props.level : null;
  return cn(
    "flex shrink-0 items-center gap-1 text-sm",
    known && PRIORITY_INK[known],
    !props.bare && "rounded-full px-2 py-1",
    !props.bare && known && PRIORITY_SURFACE[known],
  );
});
</script>

<template>
  <span :class="classes">
    <PriorityIcon :level="level" />
    <span class="truncate">{{ label }}</span>
  </span>
</template>
