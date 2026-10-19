<script setup lang="ts">
import { computed } from "vue";
import { HoverCard } from "frappe-ui";
import {
  CARD_LEAVE_DELAY_MS,
  CELL_HEIGHT,
  ROW_CARD_DELAY_MS,
} from "./constants";
import { useGanttGrid } from "./useGanttGrid";

const props = withDefaults(
  defineProps<{
    /** The row's name, also the toggle's accessible name. */
    label: string;
    /** A top-level row with a chevron; child rows are indented instead. */
    topLevel?: boolean;
    expanded?: boolean;
    canExpand?: boolean;
    /** Height of the cell's content; animated for child rows. */
    height?: number;
    /** A collapsing child row draws no borders. */
    collapsed?: boolean;
  }>(),
  {
    topLevel: false,
    expanded: false,
    canExpand: false,
    height: CELL_HEIGHT,
    collapsed: false,
  },
);

const emit = defineEmits<{
  /** The cell was pressed on an expandable row. */
  toggle: [];
}>();

defineSlots<{
  /** The icon or avatar before the name. */
  icon?: () => unknown;
  /** Shown after the name, e.g. a badge. */
  badge?: () => unknown;
  /** The line under the name. */
  subtitle?: () => unknown;
  /** Opens beside the cell on hover, or when its toggle has focus. */
  card?: () => unknown;
}>();

const grid = useGanttGrid();

const toggleAttrs = computed(() => ({
  type: "button" as const,
  class:
    "absolute inset-0 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-outline-gray-3",
  "aria-label": `Toggle ${props.label}`,
  "aria-expanded": props.expanded,
}));

const style = computed(() => ({
  width: `${grid.headerWidth.value}px`,
  minWidth: `${grid.headerWidth.value}px`,
  maxWidth: `${grid.headerWidth.value}px`,
  height: `${props.height}px`,
  ...(props.collapsed ? { borderBottomWidth: 0, borderRightWidth: 0 } : {}),
}));
</script>

<template>
  <th
    class="sticky left-0 z-30 border-b border-r border-outline-gray-1 bg-surface-base text-left align-middle font-normal transition-all hover:bg-surface-gray-1"
    :style="style"
  >
    <div
      class="relative overflow-hidden transition-all duration-200 ease-in-out"
      :style="{ height: `${height}px` }"
    >
      <HoverCard
        v-if="$slots.card"
        side="right"
        align="center"
        :offset="-42"
        :hover-delay="ROW_CARD_DELAY_MS"
        :leave-delay="CARD_LEAVE_DELAY_MS"
      >
        <template #trigger>
          <button
            v-if="canExpand"
            v-bind="toggleAttrs"
            @click="emit('toggle')"
          />
          <span v-else class="absolute inset-0 z-10" />
        </template>
        <slot name="card" />
      </HoverCard>
      <button
        v-else-if="canExpand"
        v-bind="toggleAttrs"
        @click="emit('toggle')"
      />
      <div
        class="flex size-full shrink-0 items-center overflow-hidden pr-3"
        :class="topLevel ? 'pl-3' : 'pl-8'"
      >
        <div class="flex w-full min-w-0 flex-col gap-1">
          <div class="flex w-full items-center justify-between gap-1">
            <div class="flex w-full min-w-0 flex-1 items-center">
              <span
                v-if="topLevel"
                class="lucide-chevron-right mr-1 size-4 shrink-0 text-ink-gray-8 transition-transform duration-150"
                :class="{ 'rotate-90': expanded, invisible: !canExpand }"
                aria-hidden="true"
              />
              <slot name="icon" />
              <span class="ml-2 truncate text-base-medium text-ink-gray-8">
                {{ label }}
              </span>
            </div>
            <slot name="badge" />
          </div>
          <div
            class="flex w-full min-w-0 flex-1 items-center overflow-hidden"
            :class="topLevel ? 'pl-11' : 'pl-6'"
          >
            <span
              v-if="$slots.subtitle"
              class="truncate text-sm text-ink-gray-6"
            >
              <slot name="subtitle" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </th>
</template>
