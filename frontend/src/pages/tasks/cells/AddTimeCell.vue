<script setup lang="ts">
import { Tooltip } from "frappe-ui";

const emit = defineEmits<{ addTime: [] }>();
</script>

<template>
  <Tooltip text="Add time">
    <button
      type="button"
      class="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-4"
      aria-label="Add time"
      @click.stop="emit('addTime')"
    >
      <span class="lucide-clock size-4 text-ink-gray-4" aria-hidden="true" />
    </button>
  </Tooltip>
</template>
