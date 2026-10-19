<script setup lang="ts">
import { Tooltip } from "frappe-ui";
import { cn } from "@/utils/cn";

defineProps<{ title: string; value: string; href?: string }>();

const CARD =
  "flex h-20 min-w-0 flex-1 flex-col justify-between rounded-7 border border-outline-gray-1 bg-surface-elevation-1 p-3";
</script>

<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noreferrer noopener' : undefined"
    :class="
      cn(
        CARD,
        href &&
          'cursor-pointer transition-colors hover:bg-surface-gray-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3',
      )
    "
  >
    <span class="truncate text-base text-ink-gray-5">{{ title }}</span>
    <Tooltip :text="value">
      <span class="truncate text-2xl-medium text-ink-gray-8">{{ value }}</span>
    </Tooltip>
  </component>
</template>
