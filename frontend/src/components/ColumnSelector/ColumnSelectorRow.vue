<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { Button, Tooltip } from "frappe-ui";
import type { ColumnSelectorLabels, SelectorColumn } from "./types";

const props = defineProps<{
  column: SelectorColumn;
  labels: ColumnSelectorLabels;
  reorderable: boolean;
  removable: boolean;
  pinnable: boolean;
  pinDisabled: boolean;
  /** Picked up with the keyboard. */
  lifted: boolean;
  /** Source row of a pointer drag. */
  dragging: boolean;
  hintId: string;
}>();

const emit = defineEmits<{
  remove: [];
  togglePin: [];
  handleKeydown: [event: KeyboardEvent];
  handleBlur: [];
  dragstart: [];
  dragend: [];
}>();

const row = useTemplateRef("row");

const pinLabel = computed(() =>
  props.pinDisabled
    ? props.labels.pinLimit
    : props.column.pinned
      ? props.labels.unpin
      : props.labels.pin,
);

function onDragStart(event: DragEvent) {
  if (!event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "move";
  // Firefox only starts a drag when some data is set.
  event.dataTransfer.setData("text/plain", props.column.value);
  if (row.value) {
    const box = row.value.getBoundingClientRect();
    event.dataTransfer.setDragImage(
      row.value,
      Math.max(0, event.clientX - box.left),
      Math.max(0, event.clientY - box.top),
    );
  }
  emit("dragstart");
}
</script>

<template>
  <div
    ref="row"
    class="flex items-center justify-between gap-6 rounded-4 px-2 py-1 text-base text-ink-gray-8 hover:bg-surface-gray-2"
    :class="{
      'bg-surface-gray-2 opacity-50': dragging,
      'bg-surface-gray-2 shadow-sm ring-1 ring-outline-gray-3': lifted,
    }"
  >
    <div class="flex min-w-0 items-center gap-2">
      <button
        v-if="reorderable"
        type="button"
        draggable="true"
        :data-handle="column.value"
        :aria-label="`${labels.reorder}: ${column.label}`"
        :aria-describedby="hintId"
        :aria-pressed="lifted"
        class="flex shrink-0 cursor-grab items-center rounded-4 text-ink-gray-5 outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3 active:cursor-grabbing"
        @keydown="emit('handleKeydown', $event)"
        @blur="emit('handleBlur')"
        @dragstart="onDragStart"
        @dragend="emit('dragend')"
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
