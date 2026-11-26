<script setup lang="ts">
import { computed } from "vue";
import { ADD_ROW_HEIGHT } from "./constants";
import { useGanttGrid } from "./useGanttGrid";

const props = defineProps<{
  /** e.g. "Add project". */
  label: string;
  /** The row is open; while it animates closed it can't be reached. */
  visible: boolean;
}>();

const emit = defineEmits<{
  add: [];
}>();

const grid = useGanttGrid();
const height = computed(() => `${props.visible ? ADD_ROW_HEIGHT : 0}px`);
</script>

<template>
  <tr
    class="touch-pan-y"
    :class="!visible && 'pointer-events-none'"
    :aria-hidden="!visible || undefined"
  >
    <th
      class="sticky left-0 z-30 cursor-pointer border-b border-r border-outline-gray-1 bg-surface-base text-left align-middle font-normal transition-all hover:bg-surface-gray-1"
      :style="{
        width: `${grid.headerWidth.value}px`,
        minWidth: `${grid.headerWidth.value}px`,
        maxWidth: `${grid.headerWidth.value}px`,
        height,
        ...(visible ? {} : { borderBottomWidth: 0, borderRightWidth: 0 }),
      }"
    >
      <div
        class="overflow-hidden transition-all duration-200 ease-in-out"
        :style="{ height }"
      >
        <button
          type="button"
          class="flex size-full items-center gap-2 overflow-hidden pl-8 pr-3 text-base-medium text-ink-gray-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-outline-gray-3"
          :tabindex="visible ? undefined : -1"
          @click="emit('add')"
        >
          <span class="lucide-plus size-4 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ label }}</span>
        </button>
      </div>
    </th>
    <td
      v-for="(week, index) in grid.timeline.value.weeks"
      :key="index"
      :colspan="week.days.length"
      class="overflow-hidden bg-surface-gray-1/50 transition-all duration-200 ease-in-out"
      :class="visible && 'border-b border-r border-outline-gray-1'"
      :style="{ height }"
    />
    <td class="w-0 min-w-0 max-w-0 border-0 p-0" aria-hidden="true" />
  </tr>
</template>
