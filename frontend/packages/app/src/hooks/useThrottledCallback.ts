/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a throttled version of the given callback. Calls are coalesced using
 * `requestAnimationFrame`, so the callback fires at most once per paint frame
 * regardless of how rapidly the returned function is invoked. Any invocations
 * while a frame is already pending are dropped.
 *
 * The latest version of `callback` is always used (no stale-closure issues),
 * and any pending frame is cancelled automatically on unmount.
 *
 * @example
 * const onScroll = useThrottledCallback(() => { ... });
 * el.addEventListener("scroll", onScroll);
 */
export function useThrottledCallback<T extends unknown[]>(
  callback: (...args: T) => void,
): (...args: T) => void {
  const rafRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  // Keep callbackRef current without resetting the throttle.
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Cancel any pending frame on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return useCallback((...args: T) => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      callbackRef.current(...args);
    });
  }, []);
}
