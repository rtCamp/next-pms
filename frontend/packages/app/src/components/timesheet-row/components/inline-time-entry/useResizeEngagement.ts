/**
 * External dependencies.
 */
import { useCallback, useEffect, useState, type PointerEvent } from "react";

export const useResizeEngagement = () => {
  const [isResizeActive, setIsResizeActive] = useState(false);

  useEffect(() => {
    if (!isResizeActive) return;

    const stopResize = () => setIsResizeActive(false);

    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
    window.addEventListener("mouseup", stopResize);
    window.addEventListener("touchend", stopResize);
    window.addEventListener("contextmenu", stopResize);
    window.addEventListener("blur", stopResize);

    return () => {
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      window.removeEventListener("mouseup", stopResize);
      window.removeEventListener("touchend", stopResize);
      window.removeEventListener("contextmenu", stopResize);
      window.removeEventListener("blur", stopResize);
    };
  }, [isResizeActive]);

  const onResizePointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;

    const editor = (e.target as Element | null)?.closest(".ProseMirror");
    if (!(editor instanceof HTMLElement)) return;

    const rect = editor.getBoundingClientRect();
    const resizeHandleSize = 20;
    const isResizeHandlePointerDown =
      e.clientX >= rect.right - resizeHandleSize &&
      e.clientY >= rect.bottom - resizeHandleSize;

    if (isResizeHandlePointerDown) {
      setIsResizeActive(true);
    }
  }, []);

  return { isResizeActive, onResizePointerDown };
};
