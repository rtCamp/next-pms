import { useEffect } from "react";
import { deBounce } from "../../../utils";

const DEFAULT_DEBOUNCE_MS = 300;

type UseContainerResizeOptions = {
  rootRef: React.RefObject<HTMLDivElement | null>;
  onWidthChange: (width: number) => void;
  debounceMs?: number;
};

export function useContainerResize({
  rootRef,
  onWidthChange,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseContainerResizeOptions) {
  useEffect(() => {
    const container = rootRef.current?.parentElement;
    if (!container) {
      return;
    }

    let isDisposed = false;
    let pendingWidth: number | null = null;

    const flushPendingWidth = () => {
      if (isDisposed) {
        return;
      }

      if (pendingWidth === null) {
        return;
      }

      onWidthChange(pendingWidth);
      pendingWidth = null;
    };

    const debouncedFlushPendingWidth = deBounce(flushPendingWidth, debounceMs);

    onWidthChange(container.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width === undefined) {
        return;
      }

      pendingWidth = width;
      debouncedFlushPendingWidth();
    });

    observer.observe(container);

    return () => {
      isDisposed = true;
      observer.disconnect();
    };
  }, [debounceMs, onWidthChange, rootRef]);
}
