/**
 * External dependencies.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type PointerEventHandler,
} from "react";

const MIN_BAR_WIDTH = 12;
const INTERACTION_THRESHOLD = 3;

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
  type: "move" | "resize";
  pointerId: number;
  startX: number;
  startLeft: number;
  startWidth: number;
  currentTarget: HTMLDivElement | HTMLSpanElement;
};

type UseGanttBarInteractionOptions = {
  left: number;
  width: number;
  movable?: boolean;
  snapUnitPx?: number;
  minLeft?: number;
  maxRight?: number;
  onMoveEnd?: (nextLeft: number) => void;
  onResizeEnd?: (nextWidth: number) => void;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onPointerMove?: PointerEventHandler<HTMLDivElement>;
  onPointerUp?: PointerEventHandler<HTMLDivElement>;
  onPointerCancel?: PointerEventHandler<HTMLDivElement>;
  resetLeftOnMoveEnd?: boolean;
  resetWidthOnResizeEnd?: boolean;
};

/**
 * Owns the move / resize pointer lifecycle for gantt bars.
 */
export function useGanttBarInteraction({
  left,
  width,
  movable = false,
  snapUnitPx,
  minLeft,
  maxRight,
  onMoveEnd,
  onResizeEnd,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  resetLeftOnMoveEnd = false,
  resetWidthOnResizeEnd = false,
}: UseGanttBarInteractionOptions) {
  const [liveLeft, setLiveLeft] = useState(left);
  const [liveWidth, setLiveWidth] = useState(width);
  const [isInteracting, setIsInteracting] = useState(false);
  const liveLeftRef = useRef(left);
  const liveWidthRef = useRef(width);
  const activeInteractionRef = useRef<ActiveInteraction | null>(null);
  const interactionMovedRef = useRef(false);
  const suppressClickRef = useRef(false);

  const clampLeft = useCallback(
    (nextLeft: number, nextWidth = liveWidthRef.current) => {
      const resolvedMinLeft = minLeft ?? Number.NEGATIVE_INFINITY;
      const resolvedMaxLeft =
        maxRight === undefined
          ? Number.POSITIVE_INFINITY
          : maxRight - nextWidth;

      return clamp(nextLeft, resolvedMinLeft, resolvedMaxLeft);
    },
    [maxRight, minLeft],
  );

  const clampWidth = useCallback(
    (nextWidth: number, nextLeft = liveLeftRef.current) => {
      const resolvedMaxWidth =
        maxRight === undefined ? Number.POSITIVE_INFINITY : maxRight - nextLeft;

      return clamp(nextWidth, MIN_BAR_WIDTH, resolvedMaxWidth);
    },
    [maxRight],
  );

  useEffect(() => {
    if (!activeInteractionRef.current) {
      setLiveLeft(left);
      liveLeftRef.current = left;
    }
  }, [left]);

  useEffect(() => {
    if (!activeInteractionRef.current) {
      setLiveWidth(width);
      liveWidthRef.current = width;
    }
  }, [width]);

  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
    };
  }, []);

  /**
   * Resets transient interaction state once a move or resize completes.
   */
  const finishInteraction = useCallback(() => {
    activeInteractionRef.current = null;
    setIsInteracting(false);
    document.body.style.userSelect = "";

    if (interactionMovedRef.current) {
      suppressClickRef.current = true;
    }
  }, []);

  /**
   * Cancels the currently active pointer interaction and restores the last committed geometry.
   */
  const cancelActiveInteraction = useCallback(() => {
    const activeInteraction = activeInteractionRef.current;
    if (!activeInteraction) {
      return;
    }

    if (
      activeInteraction.currentTarget.hasPointerCapture(
        activeInteraction.pointerId,
      )
    ) {
      activeInteraction.currentTarget.releasePointerCapture(
        activeInteraction.pointerId,
      );
    }

    if (activeInteraction.type === "move") {
      liveLeftRef.current = left;
      setLiveLeft(left);
    }

    if (activeInteraction.type === "resize") {
      liveWidthRef.current = width;
      setLiveWidth(width);
    }

    activeInteractionRef.current = null;
    setIsInteracting(false);
    document.body.style.userSelect = "";
    interactionMovedRef.current = false;
  }, [left, width]);

  /**
   * Listens for Escape while a drag or resize is active so in-progress pointer interactions can be cancelled.
   */
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

  /**
   * Starts dragging the full bar body when move interactions are enabled.
   */
  const handleBarPointerDown: PointerEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault();
      activeInteractionRef.current = {
        type: "move",
        pointerId: event.pointerId,
        startX: event.clientX,
        startLeft: liveLeftRef.current,
        startWidth: liveWidthRef.current,
        currentTarget: event.currentTarget,
      };
      interactionMovedRef.current = false;
      setIsInteracting(true);
      document.body.style.userSelect = "none";
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  /**
   * Updates the live preview position while the bar body is being dragged.
   */
  const handleBarPointerMove: PointerEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      const interaction = activeInteractionRef.current;
      if (
        !interaction ||
        interaction.type !== "move" ||
        interaction.pointerId !== event.pointerId
      ) {
        return;
      }

      event.stopPropagation();

      const deltaX = event.clientX - interaction.startX;
      if (Math.abs(deltaX) > INTERACTION_THRESHOLD) {
        interactionMovedRef.current = true;
      }

      const nextLeft = clampLeft(
        interaction.startLeft + deltaX,
        liveWidthRef.current,
      );
      liveLeftRef.current = nextLeft;
      setLiveLeft(nextLeft);
    },
    [clampLeft],
  );

  /**
   * Commits the snapped preview position when body dragging ends.
   */
  const handleBarPointerUp: PointerEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      const interaction = activeInteractionRef.current;
      if (
        !interaction ||
        interaction.type !== "move" ||
        interaction.pointerId !== event.pointerId
      ) {
        return;
      }

      event.stopPropagation();
      event.currentTarget.releasePointerCapture(event.pointerId);

      const snappedLeft = clampLeft(
        snapValue(liveLeftRef.current, snapUnitPx, minLeft ?? 0),
        liveWidthRef.current,
      );

      onMoveEnd?.(snappedLeft);
      liveLeftRef.current = resetLeftOnMoveEnd ? left : snappedLeft;
      setLiveLeft(liveLeftRef.current);
      finishInteraction();
    },
    [
      clampLeft,
      finishInteraction,
      left,
      minLeft,
      onMoveEnd,
      resetLeftOnMoveEnd,
      snapUnitPx,
    ],
  );

  /**
   * Restores the previous position when body dragging is cancelled.
   */
  const handleBarPointerCancel: PointerEventHandler<HTMLDivElement> =
    useCallback(
      (event) => {
        const interaction = activeInteractionRef.current;
        if (
          !interaction ||
          interaction.type !== "move" ||
          interaction.pointerId !== event.pointerId
        ) {
          return;
        }

        event.stopPropagation();
        event.currentTarget.releasePointerCapture(event.pointerId);
        liveLeftRef.current = left;
        setLiveLeft(left);
        finishInteraction();
      },
      [finishInteraction, left],
    );

  /**
   * Starts resizing from the handle at the bar edge.
   */
  const handleResizePointerDown: PointerEventHandler<HTMLSpanElement> =
    useCallback((event) => {
      event.preventDefault();
      event.stopPropagation();
      activeInteractionRef.current = {
        type: "resize",
        pointerId: event.pointerId,
        startX: event.clientX,
        startLeft: liveLeftRef.current,
        startWidth: liveWidthRef.current,
        currentTarget: event.currentTarget,
      };
      interactionMovedRef.current = false;
      setIsInteracting(true);
      document.body.style.userSelect = "none";
      event.currentTarget.setPointerCapture(event.pointerId);
    }, []);

  /**
   * Updates the live preview width while the resize handle is dragged.
   */
  const handleResizePointerMove: PointerEventHandler<HTMLSpanElement> =
    useCallback(
      (event) => {
        const interaction = activeInteractionRef.current;
        if (
          !interaction ||
          interaction.type !== "resize" ||
          interaction.pointerId !== event.pointerId
        ) {
          return;
        }

        event.stopPropagation();

        const deltaX = event.clientX - interaction.startX;
        if (Math.abs(deltaX) > INTERACTION_THRESHOLD) {
          interactionMovedRef.current = true;
        }

        const nextWidth = clampWidth(
          interaction.startWidth + deltaX,
          liveLeftRef.current,
        );
        liveWidthRef.current = nextWidth;
        setLiveWidth(nextWidth);
      },
      [clampWidth],
    );

  /**
   * Commits the snapped preview width when resizing ends.
   */
  const handleResizePointerUp: PointerEventHandler<HTMLSpanElement> =
    useCallback(
      (event) => {
        const interaction = activeInteractionRef.current;
        if (
          !interaction ||
          interaction.type !== "resize" ||
          interaction.pointerId !== event.pointerId
        ) {
          return;
        }

        event.stopPropagation();
        event.currentTarget.releasePointerCapture(event.pointerId);

        const snappedWidth = clampWidth(
          snapValue(liveWidthRef.current, snapUnitPx),
          liveLeftRef.current,
        );

        onResizeEnd?.(snappedWidth);
        liveWidthRef.current = resetWidthOnResizeEnd ? width : snappedWidth;
        setLiveWidth(liveWidthRef.current);
        finishInteraction();
      },
      [
        clampWidth,
        finishInteraction,
        onResizeEnd,
        resetWidthOnResizeEnd,
        snapUnitPx,
        width,
      ],
    );

  /**
   * Restores the previous width when resizing is cancelled.
   */
  const handleResizePointerCancel: PointerEventHandler<HTMLSpanElement> =
    useCallback(
      (event) => {
        const interaction = activeInteractionRef.current;
        if (
          !interaction ||
          interaction.type !== "resize" ||
          interaction.pointerId !== event.pointerId
        ) {
          return;
        }

        event.stopPropagation();
        event.currentTarget.releasePointerCapture(event.pointerId);
        liveWidthRef.current = width;
        setLiveWidth(width);
        finishInteraction();
      },
      [finishInteraction, width],
    );

  const consumeClickSuppression = useCallback(() => {
    if (!suppressClickRef.current) {
      return false;
    }

    suppressClickRef.current = false;
    return true;
  }, []);

  /**
   * Applies click suppression after a drag and forwards a genuine click to the consumer.
   */
  const handleClick: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (consumeClickSuppression()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      onClick?.(event);
    },
    [consumeClickSuppression, onClick],
  );

  /**
   * Forwards pointer events to consumers while keeping the interaction lifecycle local to this hook.
   */
  const handleRootPointerDown: PointerEventHandler<HTMLDivElement> =
    useCallback(
      (event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && movable) {
          handleBarPointerDown(event);
        }
      },
      [handleBarPointerDown, movable, onPointerDown],
    );

  /**
   * Forwards pointer move events to consumers.
   */
  const handleRootPointerMove: PointerEventHandler<HTMLDivElement> =
    useCallback(
      (event) => {
        onPointerMove?.(event);
        handleBarPointerMove(event);
      },
      [handleBarPointerMove, onPointerMove],
    );

  /**
   * Forwards pointer up events to consumers and ends move interactions.
   */
  const handleRootPointerUp: PointerEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      onPointerUp?.(event);
      handleBarPointerUp(event);
    },
    [handleBarPointerUp, onPointerUp],
  );

  /**
   * Forwards pointer cancel events to consumers and cancels move interactions.
   */
  const handleRootPointerCancel: PointerEventHandler<HTMLDivElement> =
    useCallback(
      (event) => {
        onPointerCancel?.(event);
        handleBarPointerCancel(event);
      },
      [handleBarPointerCancel, onPointerCancel],
    );

  return {
    isInteracting,
    liveLeft,
    liveWidth,
    handleClick,
    handleRootPointerDown,
    handleRootPointerMove,
    handleRootPointerUp,
    handleRootPointerCancel,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
    handleResizePointerCancel,
  };
}
