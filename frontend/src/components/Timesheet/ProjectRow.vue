<script setup lang="ts">
import RowToggle from "./RowToggle.vue";
import {
  ACTION_CELL_CLASS,
  CELL_CLASS,
  EMPTY_CELL_CLASS,
  ROW_CLASS,
  TOTAL_TEXT_CLASS,
} from "./constants";
import type { ProjectRowProps } from "./types";

withDefaults(defineProps<ProjectRowProps>(), {
  totalHours: "",
  status: "not-submitted",
  highlightTimeEntries: false,
});

const collapsed = defineModel<boolean>("collapsed", { default: false });

defineSlots<{
  /** Icon before the label; defaults to a folder. */
  prefix?: () => unknown;
}>();
</script>

<template>
  <div :class="ROW_CLASS" data-testid="project-row">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <RowToggle
        label="Toggle project"
        :collapsed="collapsed"
        @click="collapsed = !collapsed"
      />
      <div class="flex min-w-0 items-center gap-2 text-ink-gray-9">
        <span class="flex shrink-0 items-center">
          <slot name="prefix">
            <span class="lucide-folder size-4" aria-hidden="true" />
          </slot>
        </span>
        <span class="min-w-0 truncate text-base-medium">{{ label }}</span>
      </div>
    </div>

    <div
      v-for="(entry, index) in timeEntries"
      :key="`${entry}-${index}`"
      :class="[
        CELL_CLASS,
        'text-base text-ink-gray-6 lining-nums tabular-nums',
        highlightTimeEntries && entry !== '' && '!text-ink-gray-9 font-medium',
      ]"
    >
      <span v-if="entry === ''" :class="EMPTY_CELL_CLASS">-</span>
      <span v-else>{{ entry }}</span>
    </div>

    <div :class="[CELL_CLASS, 'text-base-medium text-ink-gray-5']">
      <span :class="['lining-nums tabular-nums', TOTAL_TEXT_CLASS[status]]">{{
        totalHours
      }}</span>
    </div>

    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
