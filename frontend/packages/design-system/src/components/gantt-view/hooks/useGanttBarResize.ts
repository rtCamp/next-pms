import { useEffect, useRef, useState, type PointerEventHandler } from "react";

const MIN_BAR_WIDTH = 12;

/**
 * Snaps the raw width to the nearest multiple of the snap unit.
 */
function snapWidth(rawWidth: number, unit: number | undefined) {
  const safeUnit = unit && unit > 0 ? unit : 1;
  return Math.max(Math.round(rawWidth / safeUnit) * safeUnit, MIN_BAR_WIDTH);
}

type UseGanttBarResizeOptions = {
  width: number;
  snapUnitPx?: number;
  onResizeEnd?: (nextWidth: number) => void;
};

export function useGanttBarResize({
  width,
  snapUnitPx,
  onResizeEnd,
}: UseGanttBarResizeOptions) {
  const [liveWidth, setLiveWidth] = useState(width);
  const liveWidthRef = useRef(width);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    if (!dragStateRef.current) {
      setLiveWidth(width);
    }
  }, [width]);

  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
    };
  }, []);

  /**
   * Starts a resize drag from the handle.
   */
  const handlePointerDown: PointerEventHandler<HTMLSpanElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: liveWidth,
    };
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  /**
   * Updates the live width while the resize handle is dragged.
   */
  const handlePointerMove: PointerEventHandler<HTMLSpanElement> = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();

    const rawWidth = Math.max(
      dragState.startWidth + (event.clientX - dragState.startX),
      MIN_BAR_WIDTH,
    );
    liveWidthRef.current = rawWidth;
    setLiveWidth(rawWidth);
  };

  /**
   * Finalizes the resize interaction and emits the snapped width.
   */
  const endResize: PointerEventHandler<HTMLSpanElement> = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();

    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    document.body.style.userSelect = "";

    const snappedWidth = snapWidth(liveWidthRef.current, snapUnitPx);
    setLiveWidth(snappedWidth);
    onResizeEnd?.(snappedWidth);
  };

  return {
    liveWidth,
    handlePointerDown,
    handlePointerMove,
    endResize,
  };
}
