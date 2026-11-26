<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { Button, Tooltip } from "frappe-ui";
import { useSortable } from "@dnd-kit/vue/sortable";
import type { ColumnSelectorLabels, SelectorColumn } from "./types";

const props = defineProps<{
  column: SelectorColumn;
  /** Position within its group. */
  index: number;
  /** Pinned and unpinned columns reorder only within their own group. */
  group: "pinned" | "columns";
  labels: ColumnSelectorLabels;
  reorderable: boolean;
  removable: boolean;
  pinnable: boolean;
  pinDisabled: boolean;
  hintId: string;
}>();

const emit = defineEmits<{
  remove: [];
  togglePin: [];
}>();

const row = useTemplateRef("row");

const { isDragging } = useSortable({
  id: () => props.column.value,
  index: () => props.index,
  group: () => props.group,
  type: () => props.group,
  accept: () => props.group,
  disabled: () => !props.reorderable,
  // Without a handle, dnd-kit would make the whole row its draggable button.
  element: () => (props.reorderable ? row.value : undefined),
  handle: useTemplateRef("handle"),
});

const pinLabel = computed(() =>
  props.pinDisabled
    ? props.labels.pinLimit
    : props.column.pinned
      ? props.labels.unpin
      : props.labels.pin,
);
</script>

<template>
  <div
    ref="row"
    role="listitem"
    class="flex items-center justify-between gap-6 rounded-4 px-2 py-1 text-base text-ink-gray-8 hover:bg-surface-gray-2"
    :class="isDragging && 'bg-surface-elevation-2 shadow-lg'"
  >
    <div class="flex min-w-0 items-center gap-2">
      <button
        v-if="reorderable"
        ref="handle"
        type="button"
        :aria-label="`${labels.reorder}: ${column.label}`"
        :aria-describedby="hintId"
        class="flex shrink-0 cursor-grab items-center rounded-4 text-ink-gray-5 outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3 active:cursor-grabbing"
      >
        <span class="lucide-grip-vertical size-3.5" aria-hidden="true" />
      </button>
      <span class="truncate">{{ column.label }}</span>
    </div>
    <div class="flex shrink-0 items-center gap-1">
      <Tooltip v-if="pinnable" :text="pinLabel">
        <Button
          variant="ghost"
          size="xs"
          class="disabled:cursor-not-allowed disabled:opacity-50"
          :aria-label="`${pinLabel}: ${column.label}`"
          :aria-pressed="!!column.pinned"
          :disabled="pinDisabled"
          @click="emit('togglePin')"
        >
          <template #icon>
            <span
              class="size-3.5"
              :class="
                column.pinned
                  ? 'lucide-pin-off text-ink-gray-8'
                  : 'lucide-pin text-ink-gray-4'
              "
              aria-hidden="true"
            />
          </template>
        </Button>
      </Tooltip>
      <Button
        v-if="removable"
        variant="ghost"
        size="xs"
        icon="lucide-x"
        :aria-label="`${labels.remove}: ${column.label}`"
        @click="emit('remove')"
      />
    </div>
  </div>
</template>
