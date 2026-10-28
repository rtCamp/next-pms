import { onScopeDispose, readonly, ref } from "vue";

export interface PointerDragHandlers {
  /** The pointer moved `deltaX` px from where the drag started. */
  move?: (deltaX: number) => void;
  /** The pointer was released `deltaX` px from where the drag started. */
  end?: (deltaX: number) => void;
  /** Escape was pressed, the browser cancelled the pointer, or the drag was replaced. */
  cancel?: () => void;
}

/**
 * One horizontal drag at a time, from a `pointerdown` to its release: the column
 * resize handle, a bar's edges and drag-to-create all use it. The pointer is captured,
 * so nothing else reacts to it while dragging, and Escape cancels.
 */
export function usePointerDrag() {
  const dragging = ref(false);
  let stopActive: ((cancelled: boolean) => void) | null = null;

  function start(event: PointerEvent, handlers: PointerDragHandlers) {
    stopActive?.(true);
    const { pointerId, clientX: startX } = event;
    const target =
      event.currentTarget instanceof Element ? event.currentTarget : null;
    // Untrusted (scripted) events have no live pointer to capture; capturing throws.
    if (event.isTrusted) target?.setPointerCapture(pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      handlers.move?.(moveEvent.clientX - startX);
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      stop(false);
      handlers.end?.(upEvent.clientX - startX);
    };
    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId === pointerId) stop(true);
    };
    const onKeydown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== "Escape") return;
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      stop(true);
    };

    function stop(cancelled: boolean) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeydown, true);
      if (target?.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
      document.body.style.userSelect = "";
      dragging.value = false;
      stopActive = null;
      if (cancelled) handlers.cancel?.();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKeydown, true);
    document.body.style.userSelect = "none";
    dragging.value = true;
    stopActive = stop;
  }

  onScopeDispose(() => stopActive?.(true));

  return {
    /** A drag is in progress. */
    dragging: readonly(dragging),
    start,
    /** Ends the drag in progress as cancelled. */
    cancel: () => stopActive?.(true),
  };
}
