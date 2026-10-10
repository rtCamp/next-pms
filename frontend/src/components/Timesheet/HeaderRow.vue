<script setup lang="ts">
import { Breadcrumbs } from "frappe-ui";
import { ACTION_CELL_CLASS, CELL_CLASS } from "./constants";
import type { HeaderRowProps } from "./types";

defineProps<HeaderRowProps>();
</script>

<template>
  <div
    class="flex h-7 w-full items-center justify-between border-b border-outline-gray-1 px-1 transition-colors"
    data-testid="header-row"
  >
    <div
      class="flex min-w-0 flex-1 items-center [&_button]:text-sm [&_button]:text-ink-gray-5"
    >
      <Breadcrumbs :items="breadcrumbs" />
    </div>
    <div
      v-for="(day, index) in days"
      :key="`${day}-${index}`"
      :class="[CELL_CLASS, 'text-sm text-ink-gray-6']"
    >
      {{ day }}
    </div>
    <div :class="[CELL_CLASS, 'text-sm text-ink-gray-5']">Total</div>
    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
