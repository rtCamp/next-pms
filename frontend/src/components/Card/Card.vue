<script setup lang="ts">
import { LoadingText } from "frappe-ui";
import type { CardProps } from "./types";

withDefaults(defineProps<CardProps>(), { loading: false });

defineSlots<{
  default?: () => unknown;
  actions?: () => unknown;
  "actions-left"?: () => unknown;
}>();
</script>

<template>
  <div
    class="flex flex-col rounded-lg border border-outline-gray-2 bg-surface-elevation-1 px-6 py-5 text-ink-gray-9 shadow"
    :aria-busy="loading || undefined"
  >
    <div class="flex items-baseline justify-between">
      <div class="flex items-baseline space-x-2">
        <div v-if="$slots['actions-left']" class="flex items-center space-x-2">
          <slot name="actions-left" />
        </div>
        <h2 v-if="title" class="text-xl font-semibold">{{ title }}</h2>
      </div>
      <div v-if="$slots.actions" class="flex items-center space-x-2">
        <slot name="actions" />
      </div>
    </div>
    <p v-if="subtitle" class="mt-1.5 text-base text-ink-gray-6">
      {{ subtitle }}
    </p>
    <div
      v-if="loading"
      class="mt-4 flex flex-auto flex-col items-center justify-center rounded-md"
    >
      <LoadingText />
    </div>
    <div v-else-if="$slots.default" class="mt-4 flex-auto overflow-auto">
      <slot />
    </div>
  </div>
</template>
