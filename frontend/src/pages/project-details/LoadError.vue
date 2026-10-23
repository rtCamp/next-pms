<script setup lang="ts">
import { Button } from "frappe-ui";
import { errorMessage } from "@/utils/errors";

defineProps<{ title: string; error: unknown }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <div
    role="alert"
    class="flex flex-col items-center justify-center gap-2 py-12 text-center"
  >
    <p class="text-sm font-medium text-ink-gray-7">{{ title }}</p>
    <p class="break-words text-sm text-ink-gray-5">
      {{ errorMessage(error) }}
    </p>
    <Button
      class="mt-2"
      icon-left="lucide-refresh-cw"
      label="Try again"
      @click="$emit('retry')"
    />
  </div>
</template>
