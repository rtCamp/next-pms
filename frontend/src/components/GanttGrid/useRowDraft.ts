import { computed, ref, shallowRef, watch } from "vue";
import { BAR_HEIGHT, FULL_DAY_HOURS } from "./constants";
import {
  barDateRange,
  clamp,
  isColumnOccupied,
  snapValue,
  timelineBounds,
  type BarGeometry,
  type BarMetrics,
} from "./geometry";
import type { AllocationEventData } from "./types";
import { useGanttGrid } from "./useGanttGrid";
import { usePointerDrag } from "./usePointerDrag";

/** Who and what a new allocation drawn in a row is for. */
export type DraftTarget = Pick<
  AllocationEventData,
  "employeeId" | "employeeName" | "projectId" | "projectName" | "customerName"
>;

/**
 * Drawing a new allocation in a row: hovering a free day shows "+", pressing it (or,
 * on touch and pen, pressing the free day) starts a draft one day wide that follows
 * the pointer and snaps to days on release, and then asks the page to add it.
 */
export function useRowDraft(options: {
  enabled: () => boolean;
  /** Bars that already take their days. */
  occupied: () => BarMetrics[];
  target: () => DraftTarget;
}) {
  const grid = useGanttGrid();
  const drag = usePointerDrag();
  const hoveredLeft = ref<number | null>(null);
  const draft = shallowRef<BarGeometry | null>(null);
  const canAdd = computed(() => options.enabled() && draft.value === null);

  watch(canAdd, (can) => {
    if (!can) hoveredLeft.value = null;
  });

  function slotLeft(event: PointerEvent): number | null {
    const row = event.currentTarget;
    if (!(row instanceof HTMLElement)) return null;
    if (
      event.target instanceof Element &&
      event.target.closest("[data-gantt-bar]")
    ) {
      return null;
    }
    const rect = row.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const barTop = Math.max((rect.height - BAR_HEIGHT) / 2, 0);
    if (y < barTop || y > barTop + Math.min(BAR_HEIGHT, rect.height)) {
      return null;
    }
    const { headerWidth, columnWidth, columnCount } = grid.range.value;
    const index = Math.floor(
      (event.clientX - rect.left - headerWidth) / columnWidth,
    );
    if (index < 0 || index >= columnCount) return null;
    if (isColumnOccupied(options.occupied(), index, columnWidth)) return null;
    return headerWidth + index * columnWidth;
  }

  function requestAdd(geometry: BarGeometry) {
    grid.emit("add", {
      ...options.target(),
      ...barDateRange(geometry, grid.range.value),
      hoursPerDay: FULL_DAY_HOURS,
      onSuccess: remove,
    });
  }

  function create(left: number): BarGeometry {
    hoveredLeft.value = null;
    const geometry = { left, width: grid.columnWidth.value };
    draft.value = geometry;
    return geometry;
  }

  function startDrawing(left: number, event: PointerEvent) {
    const origin = create(left);
    const unit = grid.columnWidth.value;
    const maxWidth = timelineBounds(grid.range.value).maxRight - origin.left;
    const widthAt = (deltaX: number, snap: boolean) => {
      const width = clamp(origin.width + deltaX, unit, maxWidth);
      return snap ? clamp(snapValue(width, unit), unit, maxWidth) : width;
    };
    drag.start(event, {
      move: (deltaX) => {
        draft.value = { left: origin.left, width: widthAt(deltaX, false) };
      },
      end: (deltaX) => {
        const geometry = { left: origin.left, width: widthAt(deltaX, true) };
        draft.value = geometry;
        requestAdd(geometry);
      },
      cancel: remove,
    });
  }

  function remove() {
    draft.value = null;
  }

  return {
    /** Where "+" sits, from the row's left edge, while a free day is hovered. */
    hoveredLeft,
    draft,
    canAdd,
    /** Update "+" as the pointer moves over the row. */
    onPointerMove(event: PointerEvent) {
      if (canAdd.value) hoveredLeft.value = slotLeft(event);
    },
    onPointerLeave() {
      hoveredLeft.value = null;
    },
    /** Touch and pen have no hover: pressing a free day starts drawing. */
    onPointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      if (!canAdd.value) return;
      const left = slotLeft(event);
      if (left === null) return;
      event.preventDefault();
      startDrawing(left, event);
    },
    /** "+" was pressed: draw from its day. */
    startFromButton(event: PointerEvent) {
      if (!event.isPrimary || hoveredLeft.value === null) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      startDrawing(hoveredLeft.value, event);
    },
    /** "+" was activated from the keyboard: a one-day draft, added at once. */
    addAtHovered() {
      if (hoveredLeft.value === null) return;
      requestAdd(create(hoveredLeft.value));
    },
    /** The draft bar was pressed. */
    requestAdd,
    /** The draft bar was resized: it keeps the new days and asks again. */
    resizeTo(geometry: BarGeometry) {
      draft.value = geometry;
      requestAdd(geometry);
    },
    remove,
  };
}

export type RowDraft = ReturnType<typeof useRowDraft>;
