<script setup lang="ts">
import { computed, nextTick, ref, useId, useTemplateRef } from "vue";
import { Button, Combobox, Popover } from "frappe-ui";
import type { ComboboxOptionValue } from "frappe-ui";
import ColumnSelectorRow from "./ColumnSelectorRow.vue";
import type { ColumnSelectorProps, SelectorColumn } from "./types";
import {
  DEFAULT_LABELS,
  groupPinned,
  moveColumn,
  sameOrder,
  togglePinned,
  unusedColumns,
} from "./utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ColumnSelectorProps>(), {
  reorderable: true,
  pinnable: false,
  maxPinned: undefined,
  minColumns: 1,
  resettable: false,
  hideLabel: false,
  disabled: false,
  labels: undefined,
  side: "bottom",
  align: "end",
});

const emit = defineEmits<{
  "update:modelValue": [columns: SelectorColumn[]];
  reset: [];
}>();

const hintId = useId();
const list = useTemplateRef("list");

const labels = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }));
const ordered = computed(() =>
  props.pinnable ? groupPinned(props.modelValue) : props.modelValue,
);

// Order shown while a row is being moved; committed through v-model on drop.
const draft = ref<SelectorColumn[] | null>(null);
const columns = computed(() => draft.value ?? ordered.value);

const pinnedCount = computed(() =>
  props.pinnable ? columns.value.filter((column) => column.pinned).length : 0,
);
const canPin = computed(
  () => props.maxPinned === undefined || pinnedCount.value < props.maxPinned,
);
const removable = computed(() => props.modelValue.length > props.minColumns);
const addable = computed(() =>
  unusedColumns(props.availableColumns, props.modelValue),
);

function remove(column: SelectorColumn) {
  if (!removable.value) return;
  emit(
    "update:modelValue",
    ordered.value.filter((existing) => existing.value !== column.value),
  );
}

function add(value: ComboboxOptionValue | null | undefined) {
  const column = addable.value.find((existing) => existing.value === value);
  if (column) emit("update:modelValue", [...ordered.value, column]);
}

function togglePin(column: SelectorColumn) {
  emit("update:modelValue", togglePinned(ordered.value, column.value));
}

function commitDraft() {
  if (draft.value && !sameOrder(draft.value, ordered.value)) {
    emit("update:modelValue", draft.value);
  }
  draft.value = null;
}

function move(value: string, to: number) {
  const from = columns.value.findIndex((column) => column.value === value);
  const next = moveColumn(columns.value, from, to, props.pinnable);
  if (next === columns.value) return false;
  draft.value = next;
  return true;
}

// Keyboard reorder: Space lifts the row, arrows move it, Space drops, Escape cancels.
const lifted = ref<string | null>(null);
const announcement = ref("");
let refocusing = false;

function announce(value: string) {
  const index = columns.value.findIndex((column) => column.value === value);
  const column = columns.value[index];
  if (column) {
    announcement.value = `${column.label}, ${index + 1} / ${columns.value.length}`;
  }
}

function focusHandle(value: string) {
  list.value
    ?.querySelector<HTMLElement>(`[data-handle="${CSS.escape(value)}"]`)
    ?.focus();
}

function onHandleKeydown(column: SelectorColumn, event: KeyboardEvent) {
  const isLifted = lifted.value === column.value;
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    if (isLifted) {
      lifted.value = null;
      commitDraft();
    } else {
      lifted.value = column.value;
      draft.value = [...ordered.value];
    }
    announce(column.value);
  } else if (
    isLifted &&
    (event.key === "ArrowUp" || event.key === "ArrowDown")
  ) {
    event.preventDefault();
    const index = columns.value.findIndex((c) => c.value === column.value);
    const moved = move(
      column.value,
      index + (event.key === "ArrowUp" ? -1 : 1),
    );
    if (!moved) return;
    announce(column.value);
    // Vue moves the row's DOM node, which drops focus from the handle.
    refocusing = true;
    nextTick(() => {
      focusHandle(column.value);
      refocusing = false;
    });
  } else if (isLifted && event.key === "Escape") {
    // Keep Escape from also closing the popover.
    event.preventDefault();
    event.stopPropagation();
    cancelLift();
  }
}

function cancelLift() {
  lifted.value = null;
  draft.value = null;
}

function onHandleBlur() {
  if (!refocusing && lifted.value) cancelLift();
}

// Pointer reorder with native HTML5 drag and drop.
const dragged = ref<string | null>(null);
let dropped = false;

function onDragStart(column: SelectorColumn) {
  cancelLift();
  dragged.value = column.value;
  draft.value = [...ordered.value];
  dropped = false;
}

function onDragOver(index: number, event: DragEvent) {
  if (!dragged.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  move(dragged.value, index);
}

function onListDragOver(event: DragEvent) {
  if (dragged.value) event.preventDefault();
}

function onDrop(event: DragEvent) {
  if (!dragged.value) return;
  event.preventDefault();
  dropped = true;
  dragged.value = null;
  commitDraft();
}

function onDragEnd() {
  if (dropped) return;
  dragged.value = null;
  draft.value = null;
}

function onClose() {
  cancelLift();
  onDragEnd();
}
</script>

<template>
  <Popover :side="side" :align="align" @close="onClose">
    <template #trigger>
      <Button
        v-bind="$attrs"
        variant="subtle"
        :label="hideLabel ? undefined : labels.trigger"
        :aria-label="labels.trigger"
        :icon="hideLabel ? 'lucide-columns-3' : undefined"
        :icon-left="hideLabel ? undefined : 'lucide-columns-3'"
        :disabled="disabled"
      />
    </template>

    <div class="min-w-52 p-1.5">
      <span :id="hintId" class="sr-only">{{ labels.reorderHint }}</span>
      <span class="sr-only" aria-live="assertive">{{ announcement }}</span>
      <!-- eslint-disable vuejs-accessibility/no-static-element-interactions -- drop targets for pointer drags; the keyboard reorders through the handles -->
      <div ref="list" role="list" @dragover="onListDragOver" @drop="onDrop">
        <div
          v-for="(column, index) in columns"
          :key="column.value"
          role="listitem"
          @dragover="onDragOver(index, $event)"
        >
          <!-- eslint-enable vuejs-accessibility/no-static-element-interactions -->
          <div
            v-if="pinnedCount > 0 && index === pinnedCount"
            aria-hidden="true"
            class="my-1.5 border-t border-outline-gray-1"
          />
          <ColumnSelectorRow
            :column="column"
            :labels="labels"
            :reorderable="reorderable"
            :removable="removable"
            :pinnable="pinnable"
            :pin-disabled="!column.pinned && !canPin"
            :lifted="lifted === column.value"
            :dragging="dragged === column.value"
            :hint-id="hintId"
            @remove="remove(column)"
            @toggle-pin="togglePin(column)"
            @handle-keydown="onHandleKeydown(column, $event)"
            @handle-blur="onHandleBlur"
            @dragstart="onDragStart(column)"
            @dragend="onDragEnd"
          />
        </div>
      </div>

      <div
        v-if="addable.length > 0 || resettable"
        class="mt-1.5 flex flex-col gap-1 border-t border-outline-gray-1 pt-1.5"
      >
        <!-- `justify-stretch` acts as start in a flex row and outranks Button's `justify-center`. -->
        <Combobox
          v-if="addable.length > 0"
          :options="addable"
          :model-value="null"
          :placeholder="labels.search"
          side="bottom"
          align="start"
          @update:model-value="add"
        >
          <template #trigger="{ open }">
            <Button
              variant="ghost"
              class="w-full justify-stretch"
              aria-haspopup="listbox"
              :aria-expanded="open"
            >
              <template #prefix>
                <span
                  class="lucide-plus size-4 text-ink-gray-5"
                  aria-hidden="true"
                />
              </template>
              <span class="text-ink-gray-5">{{ labels.addColumn }}</span>
            </Button>
          </template>
        </Combobox>
        <Button
          v-if="resettable"
          variant="ghost"
          class="w-full justify-stretch"
          @click="emit('reset')"
        >
          <template #prefix>
            <span
              class="lucide-rotate-ccw size-4 text-ink-gray-5"
              aria-hidden="true"
            />
          </template>
          <span class="text-ink-gray-5">{{ labels.resetToDefault }}</span>
        </Button>
      </div>
    </div>
  </Popover>
</template>
