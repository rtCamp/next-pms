<script setup lang="ts">
import { Breadcrumbs } from "frappe-ui";
import FilledStarIcon from "./FilledStarIcon.vue";
import {
  ACTION_CELL_CLASS,
  CELL_CLASS,
  ROW_CLASS,
  TOTAL_TEXT_CLASS,
} from "./constants";
import type { TotalRowProps } from "./types";

withDefaults(defineProps<TotalRowProps>(), {
  starred: false,
  totalHours: "",
  status: "not-submitted",
});

defineSlots<{
  /** Icon before the breadcrumbs; replaces the star. */
  prefix?: () => unknown;
}>();
</script>

<template>
  <div :class="ROW_CLASS" data-testid="total-row">
    <div class="flex min-w-0 flex-1 items-center">
      <div class="flex min-w-0 items-center gap-2 text-ink-gray-9">
        <span class="flex w-4 shrink-0 items-center justify-center">
          <slot name="prefix">
            <FilledStarIcon v-if="starred" role="img" aria-label="Starred" />
            <span
              v-else
              class="lucide-star-off size-4 -scale-x-100 text-ink-gray-4"
              role="img"
              aria-label="Not starred"
            />
          </slot>
        </span>
        <div
          class="min-w-0 [&_[aria-hidden]]:text-ink-gray-9 [&_button]:cursor-default [&_button]:text-base-medium [&_button]:text-ink-gray-9"
        >
          <Breadcrumbs :items="breadcrumbs" />
        </div>
      </div>
    </div>

    <div
      v-for="(entry, index) in totalTimeEntries"
      :key="index"
      :class="[
        CELL_CLASS,
        'text-base-medium text-ink-gray-9 lining-nums tabular-nums',
      ]"
    >
      {{ entry }}
    </div>

    <div :class="[CELL_CLASS, 'text-base-medium text-ink-gray-5']">
      <span :class="['lining-nums tabular-nums', TOTAL_TEXT_CLASS[status]]">{{
        totalHours
      }}</span>
    </div>

    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
