<script setup lang="ts">
import { Button } from "frappe-ui";

defineProps<{
  /** Accessible name, e.g. "Toggle week". */
  label: string;
  collapsed: boolean;
}>();
</script>

<template>
  <Button
    variant="ghost"
    icon="lucide-chevron-down"
    class="!w-4 transition-transform hover:!bg-transparent focus:!bg-transparent active:!bg-transparent"
    :class="collapsed ? '-rotate-90' : 'rotate-0'"
    :aria-label="label"
    :aria-expanded="!collapsed"
  />
</template>
