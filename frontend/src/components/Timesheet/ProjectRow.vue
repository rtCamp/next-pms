<script setup lang="ts">
import RowToggle from "./RowToggle.vue";
import TimeCell from "./TimeCell.vue";
import {
  ACTION_CELL_CLASS,
  BUTTON_CELL_CLASS,
  CELL_CLASS,
  ROW_CLASS,
  totalHoursClass,
} from "./constants";
import type { ProjectRowProps } from "./types";

withDefaults(defineProps<ProjectRowProps>(), {
  totalHours: "",
  highlightTimeEntries: false,
});

const collapsed = defineModel<boolean>("collapsed", { default: false });

const emit = defineEmits<{
  /** A day's add-time button was pressed; `date` is the cell's `date`. */
  cellClick: [dayIndex: number, date: string | undefined];
}>();

defineSlots<{
  /** Icon before the label; defaults to a folder. */
  prefix?: () => unknown;
}>();
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -- a pointer shortcut; the chevron button is the keyboard control -->
  <div :class="[ROW_CLASS, 'cursor-pointer']" @click="collapsed = !collapsed">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <RowToggle :label="`Toggle ${label}`" :collapsed="collapsed" />
      <div
        class="flex min-w-0 max-w-75 items-center gap-2 text-ink-gray-8 sm:max-w-112"
      >
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
      :key="index"
      :class="BUTTON_CELL_CLASS"
    >
      <TimeCell
        :time="entry.time"
        :disabled="entry.disabled"
        :class="
          highlightTimeEntries && entry.time !== ''
            ? 'text-base-medium text-ink-gray-8'
            : 'text-base text-ink-gray-6'
        "
        @click.stop="emit('cellClick', index, entry.date)"
      />
    </div>

    <div :class="CELL_CLASS">
      <span
        :class="totalHoursClass({ theme: totalHoursTheme, weight: 'regular' })"
      >
        {{ totalHours }}
      </span>
    </div>

    <div :class="ACTION_CELL_CLASS" />
  </div>
</template>
