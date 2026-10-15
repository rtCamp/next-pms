<script setup lang="ts">
import { computed, useId } from "vue";
import { Button, Combobox, Popover } from "frappe-ui";
import type { ComboboxOptionValue } from "frappe-ui";
import { Accessibility } from "@dnd-kit/dom";
import { isSortable } from "@dnd-kit/dom/sortable";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragDropManager,
  type DragDropProviderProps,
  type DragEndEvent,
} from "@dnd-kit/vue";
import ColumnSelectorRow from "./ColumnSelectorRow.vue";
import type { ColumnSelectorProps, SelectorColumn } from "./types";
import {
  DEFAULT_LABELS,
  groupPinned,
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

const labels = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }));
const ordered = computed(() =>
  props.pinnable ? groupPinned(props.modelValue) : props.modelValue,
);

const groups = computed(() =>
  props.pinnable
    ? {
        pinned: ordered.value.filter((column) => column.pinned),
        columns: ordered.value.filter((column) => !column.pinned),
      }
    : { pinned: [], columns: ordered.value },
);
const pinnedCount = computed(() => groups.value.pinned.length);
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

function onDragEnd(event: DragEndEvent) {
  if (event.canceled) return;
  const ids = move(
    {
      pinned: groups.value.pinned.map((column) => column.value),
      columns: groups.value.columns.map((column) => column.value),
    },
    event,
  );
  const byValue = new Map(
    ordered.value.map((column) => [column.value, column]),
  );
  const next = [...ids.pinned, ...ids.columns].map((id) => byValue.get(id)!);
  if (!sameOrder(next, ordered.value)) emit("update:modelValue", next);
}

// Announce the column's label and position rather than its id.
function position(manager: DragDropManager) {
  const source = manager.dragOperation.source;
  if (!source || !isSortable(source)) return undefined;
  const offset = source.group === "columns" ? groups.value.pinned.length : 0;
  const column = ordered.value.find((existing) => existing.value === source.id);
  return `${column?.label ?? source.id}, ${offset + source.index + 1} / ${ordered.value.length}`;
}

const plugins: DragDropProviderProps["plugins"] = (defaults) => [
  ...defaults,
  Accessibility.configure({
    announcements: {
      dragstart: (_: unknown, manager: DragDropManager) => position(manager),
      dragover: (_: unknown, manager: DragDropManager) => position(manager),
      dragend: (_: unknown, manager: DragDropManager) => position(manager),
    },
  }),
];
</script>

<template>
  <Popover :side="side" :align="align">
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

    <div class="min-w-40 p-1.5">
      <span :id="hintId" class="sr-only">{{ labels.reorderHint }}</span>
      <DragDropProvider :plugins="plugins" @drag-end="onDragEnd">
        <template v-for="group in ['pinned', 'columns'] as const" :key="group">
          <div
            v-if="group === 'columns' && groups.pinned.length > 0"
            aria-hidden="true"
            class="my-1.5 border-t border-outline-gray-1"
          />
          <div v-if="groups[group].length > 0" role="list">
            <ColumnSelectorRow
              v-for="(column, index) in groups[group]"
              :key="column.value"
              :column="column"
              :index="index"
              :group="group"
              :labels="labels"
              :reorderable="reorderable"
              :removable="removable"
              :pinnable="pinnable"
              :pin-disabled="!column.pinned && !canPin"
              :hint-id="hintId"
              @remove="remove(column)"
              @toggle-pin="togglePin(column)"
            />
          </div>
        </template>
      </DragDropProvider>

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
