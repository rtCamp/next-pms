import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEventHandler,
} from "react";

/**
 * Clamps a value between a min and max ensuring the min is not greater than the max.
 */
function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

/**
 * Snaps a raw value to the nearest multiple of the unit from the origin ensuring the unit is positive and non-zero.
 */
function snapValue(rawValue: number, unit: number | undefined, origin = 0) {
  const safeUnit = unit && unit > 0 ? unit : 1;
  return origin + Math.round((rawValue - origin) / safeUnit) * safeUnit;
}

type ActiveInteraction = {
  edge: "start" | "end";
  pointerId: number;
  startX: number;
  startLeft: number;
  startWidth: number;
  currentTarget: HTMLSpanElement;
};

type ResizeGeometry = {
  left: number;
  width: number;
};

type UseGanttBarInteractionOptions = {
  left: number;
  width: number;
  snapUnitPx?: number;
  minLeft?: number;
  maxRight?: number;
  onResizeEnd?: (geometry: ResizeGeometry) => void;
};

export function useGanttBarInteraction({
  left,
  width,
  snapUnitPx,
  minLeft,
  maxRight,
  onResizeEnd,
}: UseGanttBarInteractionOptions) {
  const [liveLeft, setLiveLeft] = useState(left);
  const [liveWidth, setLiveWidth] = useState(width);
  const [isInteracting, setIsInteracting] = useState(false);
  const liveLeftRef = useRef(left);
  const liveWidthRef = useRef(width);
  const activeInteractionRef = useRef<ActiveInteraction | null>(null);
  const minWidth = snapUnitPx && snapUnitPx > 0 ? snapUnitPx : 1;

  const setLiveGeometry = useCallback((nextLeft: number, nextWidth: number) => {
    liveLeftRef.current = nextLeft;
    liveWidthRef.current = nextWidth;
    setLiveLeft(nextLeft);
    setLiveWidth(nextWidth);
  }, []);

  const resetLiveGeometry = useCallback(() => {
    setLiveGeometry(left, width);
  }, [left, setLiveGeometry, width]);

  const releasePointerCapture = useCallback(
    (interaction: ActiveInteraction) => {
      if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
        interaction.currentTarget.releasePointerCapture(interaction.pointerId);
      }
    },
    [],
  );

  const clampWidth = useCallback(
    (nextWidth: number, nextLeft = liveLeftRef.current) => {
      const resolvedMaxWidth =
        maxRight === undefined ? Number.POSITIVE_INFINITY : maxRight - nextLeft;

      return clamp(nextWidth, minWidth, resolvedMaxWidth);
    },
    [maxRight, minWidth],
  );

  useEffect(() => {
    if (!activeInteractionRef.current) {
      setLiveGeometry(left, width);
    }
  }, [left, setLiveGeometry, width]);

  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
    };
  }, []);

  const finishInteraction = useCallback(() => {
    activeInteractionRef.current = null;
    setIsInteracting(false);
    document.body.style.userSelect = "";
  }, []);

  const cancelActiveInteraction = useCallback(() => {
    const activeInteraction = activeInteractionRef.current;
    if (!activeInteraction) {
      return;
    }

    releasePointerCapture(activeInteraction);
    resetLiveGeometry();
    finishInteraction();
  }, [finishInteraction, releasePointerCapture, resetLiveGeometry]);

  useEffect(() => {
    if (!isInteracting) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      cancelActiveInteraction();
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [cancelActiveInteraction, isInteracting]);

  const handleResizePointerDown = useCallback(
    (edge: "start" | "end"): PointerEventHandler<HTMLSpanElement> =>
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        activeInteractionRef.current = {
          edge,
          pointerId: event.pointerId,
          startX: event.clientX,
          startLeft: liveLeftRef.current,
          startWidth: liveWidthRef.current,
          currentTarget: event.currentTarget,
        };
        setIsInteracting(true);
        document.body.style.userSelect = "none";
        event.currentTarget.setPointerCapture(event.pointerId);
      },
    [],
  );

  const handleResizePointerMove: PointerEventHandler<HTMLSpanElement> =
    useCallback(
      (event) => {
        const interaction = activeInteractionRef.current;
        if (!interaction || interaction.pointerId !== event.pointerId) {
          return;
        }

        event.stopPropagation();

        const deltaX = event.clientX - interaction.startX;

        if (interaction.edge === "start") {
          const fixedRight = interaction.startLeft + interaction.startWidth;
          const nextLeft = clamp(
            interaction.startLeft + deltaX,
            minLeft ?? Number.NEGATIVE_INFINITY,
            fixedRight - minWidth,
          );
          const nextWidth = clampWidth(fixedRight - nextLeft, nextLeft);

          setLiveGeometry(nextLeft, nextWidth);
          return;
        }

        const nextWidth = clampWidth(
          interaction.startWidth + deltaX,
          liveLeftRef.current,
        );
        setLiveGeometry(liveLeftRef.current, nextWidth);
      },
      [clampWidth, minLeft, minWidth, setLiveGeometry],
    );

  const handleResizePointerUp: PointerEventHandler<HTMLSpanElement> =
    useCallback(
      (event) => {
        const interaction = activeInteractionRef.current;
        if (!interaction || interaction.pointerId !== event.pointerId) {
          return;
        }

        event.stopPropagation();
        releasePointerCapture(interaction);

        let snappedLeft = liveLeftRef.current;
        let snappedWidth = liveWidthRef.current;

        if (interaction.edge === "start") {
          const fixedRight = interaction.startLeft + interaction.startWidth;
          snappedLeft = clamp(
            snapValue(liveLeftRef.current, snapUnitPx, minLeft ?? 0),
            minLeft ?? Number.NEGATIVE_INFINITY,
            fixedRight - minWidth,
          );
          snappedWidth = clampWidth(fixedRight - snappedLeft, snappedLeft);
        } else {
          snappedWidth = clampWidth(
            snapValue(liveWidthRef.current, snapUnitPx),
            liveLeftRef.current,
          );
        }

        setLiveGeometry(snappedLeft, snappedWidth);
        onResizeEnd?.({ left: snappedLeft, width: snappedWidth });
        finishInteraction();
      },
      [
        clampWidth,
        finishInteraction,
        minLeft,
        minWidth,
        onResizeEnd,
        releasePointerCapture,
        setLiveGeometry,
        snapUnitPx,
      ],
    );

  const handleResizePointerCancel: PointerEventHandler<HTMLSpanElement> =
    useCallback(
      (event) => {
        const interaction = activeInteractionRef.current;
        if (!interaction || interaction.pointerId !== event.pointerId) {
          return;
        }

        event.stopPropagation();
        releasePointerCapture(interaction);
        resetLiveGeometry();
        finishInteraction();
      },
      [finishInteraction, releasePointerCapture, resetLiveGeometry],
    );

  return {
    isInteracting,
    liveLeft,
    liveWidth,
    handleStartResizePointerDown: handleResizePointerDown("start"),
    handleEndResizePointerDown: handleResizePointerDown("end"),
    handleResizePointerMove,
    handleResizePointerUp,
    handleResizePointerCancel,
  };
}
