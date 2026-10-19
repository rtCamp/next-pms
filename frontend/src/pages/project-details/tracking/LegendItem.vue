<script setup lang="ts">
import { Tooltip } from "frappe-ui";

defineProps<{
  /** The swatch colour, e.g. `bg-surface-blue-7`. */
  swatchClass: string;
  label: string;
  value: string;
  labelTooltip?: string;
  valueClass?: string;
}>();
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      :class="['size-2 shrink-0 rounded-full', swatchClass]"
      aria-hidden="true"
    />
    <span class="min-w-0 flex-1">
      <Tooltip v-if="labelTooltip" :text="labelTooltip">
        <span class="truncate text-ink-gray-6">{{ label }}</span>
      </Tooltip>
      <span v-else class="truncate text-ink-gray-6">{{ label }}</span>
    </span>
    <span :class="['shrink-0 font-medium', valueClass]">{{ value }}</span>
  </div>
</template>
