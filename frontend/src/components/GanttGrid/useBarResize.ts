import { computed, shallowRef } from "vue";
import {
  resizeGeometry,
  timelineBounds,
  type BarGeometry,
  type ResizeEdge,
} from "./geometry";
import { useGanttGrid } from "./useGanttGrid";
import { usePointerDrag } from "./usePointerDrag";

/**
 * Dragging a bar's edges: the bar follows the pointer within the day columns and
 * snaps to whole days on release; Escape puts it back.
 */
export function useBarResize(options: {
  /** Where the bar is when no edge is being dragged. */
  geometry: () => BarGeometry;
  /** The pointer was released; the geometry is snapped to days. */
  onEnd: (geometry: BarGeometry) => void;
}) {
  const grid = useGanttGrid();
  const drag = usePointerDrag();
  const live = shallowRef<BarGeometry | null>(null);

  function start(edge: ResizeEdge, event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    const origin = options.geometry();
    const at = (deltaX: number, snap: boolean) =>
      resizeGeometry({
        edge,
        origin,
        deltaX,
        snap,
        unit: grid.columnWidth.value,
        ...timelineBounds(grid.range.value),
      });
    drag.start(event, {
      move: (deltaX) => (live.value = at(deltaX, false)),
      end: (deltaX) => {
        live.value = null;
        options.onEnd(at(deltaX, true));
      },
      cancel: () => (live.value = null),
    });
  }

  return {
    /** The geometry to draw: the dragged one while dragging. */
    geometry: computed(() => live.value ?? options.geometry()),
    resizing: computed(() => live.value !== null || drag.dragging.value),
    start,
  };
}
