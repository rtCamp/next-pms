/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { TransitionEvent } from "react";

interface UseCollapsiblePresenceOptions {
  durationMs: number;
  exitBufferMs?: number;
}

/**
 * Keeps collapsible rows mounted only while they are visible or animating.
 *
 * - opening mounts the rows at their collapsed height, waits for layout to
 *   commit, then marks them visible so the height transition can run.
 * - closing keeps the rows mounted while they animate to zero height.
 * - after the height transition ends, the rows are removed from the DOM.
 */
export function useCollapsiblePresence(
  open: boolean,
  { durationMs, exitBufferMs = 50 }: UseCollapsiblePresenceOptions,
) {
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearScheduledWork = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finishExit = useCallback(() => {
    if (open) return;
    clearScheduledWork();
    setShouldRender(false);
  }, [clearScheduledWork, open]);

  const onTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLElement>) => {
      if (event.propertyName !== "height") return;
      // If the transition was interrupted, don't finish the exit yet.
      if (durationMs > 0 && event.elapsedTime * 1000 < durationMs - 16) {
        return;
      }
      finishExit();
    },
    [durationMs, finishExit],
  );

  useEffect(() => {
    clearScheduledWork();

    if (open) {
      setShouldRender(true);
      // Wait two frames so newly mounted rows first paint at height 0;
      // then the visible state can transition them to their expanded height.
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;
          setIsVisible(true);
        });
      });
      return;
    }

    setIsVisible(false);
    if (!shouldRender) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setShouldRender(false);
    }, durationMs + exitBufferMs);
  }, [clearScheduledWork, durationMs, exitBufferMs, open, shouldRender]);

  useEffect(() => clearScheduledWork, [clearScheduledWork]);

  return {
    shouldRender,
    isVisible,
    onTransitionEnd,
  };
}
