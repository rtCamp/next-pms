<script setup lang="ts" generic="Row extends { name: string }">
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from "reka-ui";
import { groupRowMinWidth } from "./groups";
import type { GroupColumn, RecordGroup } from "./types";

const props = defineProps<{
  groups: RecordGroup<Row>[];
  /** Shown in a group without rows. */
  emptyText: string;
  /** The accessible name of the button that opens a row. */
  rowLabel: (row: Row) => string;
}>();

const emit = defineEmits<{ open: [row: Row] }>();

defineSlots<{
  /** A cell's content; the default is the row's value for the column. */
  cell?: (props: { row: Row; column: GroupColumn }) => unknown;
  /** The row's ⋯ menu. */
  actions?: (props: { row: Row }) => unknown;
}>();

const defaultOpen = props.groups.map((group) => group.value);

function cellText(row: Row, column: GroupColumn): string {
  const value = (row as Record<string, unknown>)[column.key];
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

function columnStyle(column: GroupColumn) {
  return { minWidth: column.width, flex: column.flex };
}
</script>

<template>
  <AccordionRoot type="multiple" :default-value="defaultOpen">
    <AccordionItem
      v-for="group in groups"
      :key="group.value"
      :value="group.value"
    >
      <AccordionHeader as="h3" class="w-full">
        <AccordionTrigger
          class="group mb-2 flex w-full items-center gap-2 rounded-1 border-b border-outline-gray-1 px-2 py-3 text-base-semibold text-ink-gray-8 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-outline-gray-3"
        >
          <span
            class="lucide-chevron-down size-4 shrink-0 -rotate-90 text-ink-gray-5 transition-transform group-aria-expanded:rotate-0 motion-reduce:transition-none"
            aria-hidden="true"
          />
          <span>{{ group.label }}</span>
          <span
            class="rounded-full bg-surface-gray-2 px-1.5 py-0.5 text-xs text-ink-gray-6"
          >
            {{ group.rows.length }}
          </span>
        </AccordionTrigger>
      </AccordionHeader>
      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- reka-ui exposes the panel state only as data-state -->
      <AccordionContent
        class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none"
      >
        <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
        <div class="overflow-x-auto">
          <div
            class="mb-2 flex items-center gap-2 border-b border-outline-gray-1 px-1 py-0.5 text-sm text-ink-gray-5"
            :style="{ minWidth: `${groupRowMinWidth(group.columns)}px` }"
          >
            <div
              v-for="column in group.columns"
              :key="column.key"
              class="truncate px-2 py-1.5"
              :style="columnStyle(column)"
            >
              {{ column.label }}
            </div>
            <div class="w-8 shrink-0" />
          </div>
          <p
            v-if="!group.rows.length"
            class="sticky left-0 py-6 text-center text-sm text-ink-gray-5"
          >
            {{ emptyText }}
          </p>
          <div
            v-for="row in group.rows"
            :key="row.name"
            class="relative flex items-center gap-2 border-b border-outline-gray-1 px-1 py-1.5 text-base text-ink-gray-6 last:mb-5 hover:bg-surface-gray-1"
            :style="{ minWidth: `${groupRowMinWidth(group.columns)}px` }"
          >
            <div
              v-for="(column, index) in group.columns"
              :key="column.key"
              class="flex min-w-0 px-2 py-1.5"
              :style="columnStyle(column)"
            >
              <button
                v-if="index === 0"
                type="button"
                class="absolute inset-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-outline-gray-3"
                :aria-label="rowLabel(row)"
                @click="emit('open', row)"
              />
              <slot name="cell" :row="row" :column="column">
                <span class="truncate">{{ cellText(row, column) }}</span>
              </slot>
            </div>
            <div class="relative flex w-8 shrink-0 justify-end">
              <slot name="actions" :row="row" />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
