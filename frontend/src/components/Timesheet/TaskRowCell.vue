<script setup lang="ts">
import { computed } from "vue";
import { Button } from "frappe-ui";
import type { TaskRowTimeEntry } from "./types";

const props = defineProps<{ entry: TaskRowTimeEntry }>();

const ariaLabel = computed(() => {
  if (props.entry.time === "") return "Add time";
  return props.entry.nonBillable
    ? `${props.entry.time}, non-billable`
    : props.entry.time;
});
</script>

<template>
  <Button
    variant="ghost"
    class="group relative !w-[57px] lining-nums tabular-nums"
    :disabled="entry.disabled"
    :aria-label="ariaLabel"
  >
    <span v-if="entry.time === ''">
      <span
        class="text-ink-gray-4"
        :class="{ 'group-hover:invisible': !entry.disabled }"
        >-</span
      >
      <span
        v-if="!entry.disabled"
        class="lucide-plus absolute inset-0 m-auto hidden size-4 group-hover:block"
        aria-hidden="true"
      />
    </span>
    <span v-else>{{ entry.time }}</span>
    <span
      v-if="entry.nonBillable"
      class="absolute -bottom-0.5 left-1/2 z-10 block size-1 -translate-x-1/2 rounded-full bg-surface-amber-3"
      aria-hidden="true"
    />
  </Button>
</template>
