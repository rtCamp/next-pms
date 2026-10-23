<script setup lang="ts">
import { Button } from "frappe-ui";
import GanttAllocationItem from "./GanttAllocationItem.vue";
import {
  allocationEventData,
  allocationSummaryText,
  type CardEntry,
} from "./rows";
import { useGanttGrid } from "./useGanttGrid";

withDefaults(
  defineProps<{
    entries: CardEntry[];
    /** Leave or a holiday on the bar's days, named at the top. */
    dayOff?: { label: string; holiday: boolean };
    /** Shows Add, for the user who may add allocations. */
    addable?: boolean;
  }>(),
  { dayOff: undefined, addable: false },
);

const emit = defineEmits<{
  add: [];
}>();

const grid = useGanttGrid();

function edit(entry: CardEntry) {
  grid.emit("edit", allocationEventData(entry.bar, entry.employeeName));
}

function remove(entry: CardEntry) {
  grid.emit(
    "delete",
    allocationEventData(entry.bar, entry.employeeName),
    allocationSummaryText(entry.bar),
  );
}
</script>

<template>
  <div class="flex max-h-128 w-70 flex-col gap-4 overflow-y-auto p-3">
    <div v-if="dayOff" class="flex items-center gap-2">
      <span
        class="size-4 shrink-0 text-ink-gray-6"
        :class="dayOff.holiday ? 'lucide-tree-palm' : 'lucide-calendar-x-2'"
        aria-hidden="true"
      />
      <span class="truncate text-base-medium text-ink-gray-7">
        {{ dayOff.label }}
      </span>
    </div>
    <div v-if="entries.length" class="flex flex-col">
      <template v-for="(entry, index) in entries" :key="index">
        <div v-if="index > 0" class="my-3 h-px w-full bg-surface-gray-3" />
        <GanttAllocationItem
          :entry="entry"
          @edit="edit(entry)"
          @delete="remove(entry)"
        />
      </template>
    </div>
    <Button
      v-if="addable && grid.hasRoleAccess.value"
      variant="solid"
      theme="gray"
      size="sm"
      class="w-full shrink-0"
      icon-left="lucide-plus"
      label="Add"
      @click="emit('add')"
    />
  </div>
</template>
