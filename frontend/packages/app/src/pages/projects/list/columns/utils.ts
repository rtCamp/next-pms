/**
 * External dependencies.
 */
import { Modifier, Plugin, type DragOperation } from "@dnd-kit/abstract";
import { directionBiased } from "@dnd-kit/collision";
import type { DragDropManager, Draggable } from "@dnd-kit/dom";

const EDGE_SCROLL_ZONE = 60;
const EDGE_SCROLL_SPEED = 25;

/**
 * Returns the sortable input configuration for a column based on its index and pinned status.
 */
export function getSortableInput(
  key: string,
  index: number,
  pinnedCount: number,
) {
  const isPinned = index < pinnedCount;
  const type = isPinned ? "pinned-column" : "scrolling-column";

  return {
    id: key,
    index: isPinned ? index : index - pinnedCount,
    group: isPinned ? "pinned" : "scrolling",
    type,
    accept: [type],
    collisionDetector: directionBiased,
  };
}

/**
 * Measures the scroller around a dragged header and the pinned list inside it.
 */
function getColumnGroups(source: Draggable | null) {
  const table = source?.element?.closest("[role=table]");
  const scroller = table?.parentElement;
  if (!table || !scroller) {
    return null;
  }

  return {
    scroller,
    scrollerRect: scroller.getBoundingClientRect(),
    pinnedRect:
      table.childElementCount > 1
        ? table.firstElementChild?.getBoundingClientRect()
        : undefined,
  };
}

/**
 * Keeps a dragged header within its own group: pinned headers over the pinned
 * list, scrolling headers between the pinned list and the scroller's right edge.
 */
export class RestrictToColumnGroup extends Modifier {
  apply({ source, transform }: DragOperation<Draggable>) {
    const groups = getColumnGroups(source);
    if (!source?.element || !groups) {
      return transform;
    }

    const { scrollerRect, pinnedRect } = groups;
    const [min, max] =
      source.type === "pinned-column" && pinnedRect
        ? [pinnedRect.left, pinnedRect.right]
        : [
            Math.max(pinnedRect?.right ?? 0, scrollerRect.left),
            scrollerRect.right,
          ];

    const { left, width } = source.element.getBoundingClientRect();
    const applied = parseFloat(getComputedStyle(source.element).translate) || 0;
    const start = left - applied;
    const x = Math.min(Math.max(transform.x, min - start), max - start - width);

    return { ...transform, x };
  }
}

/**
 * Scrolls left while a scrolling header is held near the pinned list, since
 * the stock auto scroller only reacts to the scroller's own left edge, which
 * sits under the pinned columns.
 */
export class PinnedEdgeAutoScroller extends Plugin<DragDropManager> {
  constructor(manager: DragDropManager) {
    super(manager);

    let scroller: HTMLElement | undefined;
    let speed = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      clearInterval(interval);
      interval = undefined;
    };

    const offMove = manager.monitor.addEventListener("dragmove", () => {
      const { source, position } = manager.dragOperation;
      const groups =
        source?.type === "scrolling-column" ? getColumnGroups(source) : null;
      const depth = groups?.pinnedRect
        ? groups.pinnedRect.right + EDGE_SCROLL_ZONE - position.current.x
        : 0;

      if (!groups || depth <= 0) {
        stop();
        return;
      }

      scroller = groups.scroller;
      speed = EDGE_SCROLL_SPEED * Math.min(depth / EDGE_SCROLL_ZONE, 1);
      interval ??= setInterval(() => {
        if (scroller) scroller.scrollLeft -= speed;
      }, 10);
    });
    const offEnd = manager.monitor.addEventListener("dragend", stop);

    this.destroy = () => {
      stop();
      offMove();
      offEnd();
    };
  }
}
