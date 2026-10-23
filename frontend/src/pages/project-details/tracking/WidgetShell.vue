<script setup lang="ts">
import { Button, Tooltip } from "frappe-ui";

defineProps<{ label: string }>();
defineEmits<{ remove: [] }>();
</script>

<template>
  <div class="relative flex min-w-0 flex-col">
    <slot />
    <Tooltip :text="`Remove ${label}`">
      <Button
        class="absolute right-2 top-2 z-10"
        variant="subtle"
        icon="lucide-x"
        :label="`Remove ${label}`"
        @click="$emit('remove')"
      />
    </Tooltip>
  </div>
</template>
