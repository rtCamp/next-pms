<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { Button, Dropdown, Tooltip } from "frappe-ui";
import { useSortable } from "@dnd-kit/vue/sortable";
import type { SortOrder } from "@/components/SortSelector";
import { CURRENCY_REQUIRED_TOOLTIP, PIN_LIMIT_TOOLTIP } from "./constants";
import type { ProjectListColumn } from "./types";

const props = defineProps<{
  column: ProjectListColumn;
  pinned: boolean;
  /** The pin limit is reached, so this unpinned column can't be pinned. */
  pinLimit: boolean;
  direction: SortOrder | null;
  /** A sort on an amount needs a currency. */
  sortDisabled: boolean;
  /** Position among the headers of its group; pinned and scrolling headers reorder apart. */
  groupIndex: number;
}>();

const emit = defineEmits<{ sort: []; togglePin: [] }>();

const ariaSort = computed(() => {
  if (!props.column.sortField) return undefined;
  if (!props.direction) return "none";
  return props.direction === "asc" ? "ascending" : "descending";
});

const pinOptions = computed(() => [
  {
    label: props.pinned ? "Unpin column" : "Pin column",
    icon: props.pinned ? "lucide-pin-off" : "lucide-pin",
    disabled: props.pinLimit,
    description: props.pinLimit ? PIN_LIMIT_TOOLTIP : undefined,
    onClick: () => emit("togglePin"),
  },
]);

const group = computed(() => (props.pinned ? "pinned" : "scrolling"));
const { isDragging } = useSortable({
  id: () => props.column.key,
  index: () => props.groupIndex,
  group,
  type: group,
  accept: group,
  element: useTemplateRef("header"),
});

function sort() {
  if (!props.sortDisabled) emit("sort");
}
</script>

<template>
  <div
    ref="header"
    role="columnheader"
    :aria-sort="ariaSort"
    class="flex min-w-0 items-center gap-1 text-sm text-ink-gray-5"
    :class="isDragging && 'opacity-50'"
  >
    <Tooltip
      v-if="column.sortField"
      :text="CURRENCY_REQUIRED_TOOLTIP"
      :disabled="!sortDisabled"
    >
      <!-- eslint-disable vue/no-restricted-v-bind -- stays hoverable so the tooltip says why -->
      <button
        type="button"
        class="flex h-7 min-w-0 items-center gap-1 rounded-4 text-sm-medium select-none"
        :class="sortDisabled && 'cursor-not-allowed text-ink-gray-4'"
        :aria-disabled="sortDisabled || undefined"
        @click="sort"
      >
        <span class="truncate">{{ column.label }}</span>
        <span
          v-if="direction"
          class="size-3.5 shrink-0 text-ink-gray-7"
          :class="direction === 'asc' ? 'lucide-arrow-up' : 'lucide-arrow-down'"
          aria-hidden="true"
        />
      </button>
      <!-- eslint-enable vue/no-restricted-v-bind -->
    </Tooltip>
    <span v-else class="flex h-7 min-w-0 items-center text-sm-medium">
      <span class="truncate">{{ column.label }}</span>
    </span>
    <Dropdown :options="pinOptions" side="bottom">
      <Button
        variant="ghost"
        size="xs"
        icon="lucide-chevron-down"
        :aria-label="`${column.label} column options`"
      />
    </Dropdown>
  </div>
</template>
