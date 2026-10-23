<script setup lang="ts">
import {
  computed,
  nextTick,
  onScopeDispose,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { Button, HoverCard } from "frappe-ui";
import { BAR_CARD_DELAY_MS, CARD_LEAVE_DELAY_MS } from "./constants";
import GanttAllocationCard from "./GanttAllocationCard.vue";
import GanttBar from "./GanttBar.vue";
import GanttBarActions from "./GanttBarActions.vue";
import { barDateRange, barDaySpan, type BarGeometry } from "./geometry";
import {
  allocationEventData,
  overlapping,
  type AllocationBar,
  type CardEntry,
} from "./rows";
import { useBarResize } from "./useBarResize";
import { useGanttGrid, type ActiveEdit } from "./useGanttGrid";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  bar: AllocationBar;
  /** Every bar in the row; the ones under this bar are listed in its card. */
  rowBars: AllocationBar[];
  employeeName?: string;
  employeeImage?: string;
}>();

const grid = useGanttGrid();
const barElement = useTemplateRef<InstanceType<typeof GanttBar>>("barElement");

const placed = computed<BarGeometry>(() => ({
  left: props.bar.barOffset + grid.headerWidth.value,
  width: props.bar.width,
}));
/** A resize waiting for Save or Cancel. */
const preview = shallowRef<BarGeometry | null>(null);
const modified = computed(
  () =>
    preview.value !== null &&
    (preview.value.left !== placed.value.left ||
      preview.value.width !== placed.value.width),
);
// New data or a new layout replaces the preview, as a saved edit does.
watch(
  [() => placed.value.left, () => placed.value.width],
  () => (preview.value = null),
);

const canResize = computed(
  () =>
    grid.hasRoleAccess.value &&
    !props.bar.recurrenceId &&
    !props.bar.fullyReduced &&
    (!props.bar.isAiCreated || grid.canManageAiAllocations.value),
);

const cardOpen = ref(false);
const resize = useBarResize({
  geometry: () => preview.value ?? placed.value,
  onEnd: (geometry) => {
    preview.value = geometry;
    focusBar();
  },
});

function startResize(edge: "start" | "end", event: PointerEvent) {
  cardOpen.value = false;
  resize.start(edge, event);
}

const variant = computed(() => {
  if (props.bar.fullyReduced) return "empty";
  return props.bar.isAiCreated ? "aiAllocation" : "allocation";
});

const dayCount = computed(() => {
  if (resize.resizing.value) {
    return barDaySpan(resize.geometry.value.width, grid.columnWidth.value);
  }
  if (modified.value && preview.value) {
    return barDaySpan(preview.value.width, grid.columnWidth.value);
  }
  return props.bar.fullNumDays;
});
const label = computed(
  () =>
    `${props.bar.hours}h/day for ${dayCount.value} day${dayCount.value === 1 ? "" : "s"}`,
);

const previewBar = computed<AllocationBar>(() =>
  modified.value && preview.value
    ? {
        ...props.bar,
        ...barDateRange(preview.value, grid.range.value),
        fullNumDays: dayCount.value,
      }
    : props.bar,
);

// Overlapping bars share the lane and stack, so the card lists the ones underneath.
const entries = computed<CardEntry[]>(() =>
  [
    previewBar.value,
    ...overlapping(
      props.rowBars.filter((other) => other !== props.bar),
      props.bar.startDate,
      props.bar.endDate,
    ),
  ].map((bar) => ({
    bar,
    employeeName: props.employeeName,
    employeeImage: props.employeeImage,
  })),
);

function focusBar() {
  nextTick(() => (barElement.value?.$el as HTMLElement | undefined)?.focus());
}

function save() {
  if (!preview.value) return;
  grid.emit("edit", {
    ...allocationEventData(props.bar, props.employeeName),
    ...barDateRange(preview.value, grid.range.value),
  });
}

function discard() {
  preview.value = null;
  focusBar();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape" || !modified.value) return;
  event.preventDefault();
  event.stopPropagation();
  discard();
}

const edit: ActiveEdit = { save, discard };
watch(modified, (isModified) => {
  if (isModified) grid.setActiveEdit(edit);
  else grid.clearActiveEdit(edit);
});
onScopeDispose(() => grid.clearActiveEdit(edit));
</script>

<template>
  <HoverCard
    :open="modified ? false : cardOpen"
    side="bottom"
    align="start"
    :offset="4"
    :hover-delay="BAR_CARD_DELAY_MS"
    :leave-delay="CARD_LEAVE_DELAY_MS"
    @update:open="cardOpen = $event"
  >
    <template #trigger>
      <GanttBar
        ref="barElement"
        role="button"
        tabindex="0"
        :class="modified ? 'z-20' : resize.resizing.value && 'z-10'"
        :variant="variant"
        :label="label"
        :left="resize.geometry.value.left"
        :width="resize.geometry.value.width"
        :crosshatch="bar.isAiCreated || bar.tentative"
        :billable="bar.billable"
        :ai="bar.isAiCreated"
        :outline="modified"
        :resizable="canResize"
        @resize-start="startResize"
        @keydown="onKeydown"
      />
    </template>
    <GanttAllocationCard :entries="entries" />
  </HoverCard>
  <GanttBarActions
    v-if="modified"
    :left="resize.geometry.value.left"
    :width="resize.geometry.value.width"
  >
    <Button variant="ghost" label="Cancel" @click="discard" />
    <Button variant="solid" label="Save" @click="save" />
  </GanttBarActions>
</template>
