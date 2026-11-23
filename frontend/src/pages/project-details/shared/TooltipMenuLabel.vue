<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";

/** A Dropdown item's label with a tooltip, e.g. why the item is disabled. */
const props = defineProps<{
  label: string;
  tooltip: string;
  disabled?: boolean;
  theme?: "gray" | "red";
}>();

// frappe-ui's own label colours, which a custom label replaces.
const textClass = computed(() => {
  if (props.disabled) return "text-ink-gray-4";
  return props.theme === "red" ? "text-ink-red-7" : "text-ink-gray-7";
});
</script>

<template>
  <Tooltip :text="tooltip">
    <!-- frappe-ui turns off pointer events on a disabled item; the label turns them back on to show the tooltip. -->
    <span
      class="pointer-events-auto block truncate leading-tighter"
      :class="textClass"
    >
      {{ label }}
    </span>
  </Tooltip>
</template>
