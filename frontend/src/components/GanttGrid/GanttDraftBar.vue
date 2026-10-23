<script setup lang="ts">
import { computed, onMounted, onScopeDispose, useTemplateRef } from "vue";
import { Button, dayjs, Tooltip } from "frappe-ui";
import { FULL_DAY_HOURS } from "./constants";
import GanttBar from "./GanttBar.vue";
import GanttBarActions from "./GanttBarActions.vue";
import { barDateRange, barDaySpan, type BarGeometry } from "./geometry";
import { useBarResize } from "./useBarResize";
import { useGanttGrid, type ActiveEdit } from "./useGanttGrid";
import type { RowDraft } from "./useRowDraft";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /** The row's draft; rendered while it has one. */
  draft: RowDraft;
}>();

const grid = useGanttGrid();
const barElement = useTemplateRef<InstanceType<typeof GanttBar>>("barElement");

const placed = computed<BarGeometry>(
  () => props.draft.draft.value ?? { left: 0, width: 0 },
);
const resize = useBarResize({
  geometry: () => placed.value,
  onEnd: (geometry) => props.draft.resizeTo(geometry),
});

const hours = computed(() =>
  Math.max(
    barDaySpan(resize.geometry.value.width, grid.columnWidth.value) *
      FULL_DAY_HOURS,
    1,
  ),
);
const endDate = computed(() =>
  dayjs(barDateRange(resize.geometry.value, grid.range.value).endDate).format(
    "MMM D",
  ),
);

function add() {
  props.draft.requestAdd(placed.value);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    add();
  } else if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    props.draft.remove();
  }
}

const edit: ActiveEdit = { save: add, discard: () => props.draft.remove() };
onMounted(() => {
  grid.setActiveEdit(edit);
  (barElement.value?.$el as HTMLElement | undefined)?.focus();
});
onScopeDispose(() => grid.clearActiveEdit(edit));
</script>

<template>
  <Tooltip text="Click to add allocation">
    <GanttBar
      ref="barElement"
      role="button"
      tabindex="0"
      class="z-20"
      variant="draft"
      :left="resize.geometry.value.left"
      :width="resize.geometry.value.width"
      resizable
      @resize-start="resize.start"
      @click="add"
      @keydown="onKeydown"
    >
      <template #label>
        <span class="flex min-w-0 items-center overflow-hidden">
          <span class="min-w-0 flex-1 truncate">Add allocation</span>
          <span class="shrink-0">{{ hours }}h</span>
        </span>
      </template>
    </GanttBar>
  </Tooltip>
  <GanttBarActions
    :left="resize.geometry.value.left"
    :width="resize.geometry.value.width"
  >
    <span class="flex items-center gap-1 pr-2">
      <Button
        variant="ghost"
        icon="lucide-x"
        label="Remove draft"
        @click="draft.remove()"
      />
      <span>{{ endDate }}</span>
    </span>
  </GanttBarActions>
</template>
