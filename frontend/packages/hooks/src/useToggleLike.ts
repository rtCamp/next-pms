/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import { useFrappePostCall } from "frappe-react-sdk";

interface UseToggleLikeOptions {
  doctype: string;
  name: string;
  /** Current liked state from the server (e.g. derived from `_liked_by`). */
  liked: boolean;
  /** Called after a successful toggle, e.g. to resync a separate liked-items list. */
  onToggled?: (liked: boolean) => void;
}

/**
 * Wraps Frappe core's `frappe.desk.like.toggle_like` with optimistic update
 * and rollback-on-error, so callers don't have to re-implement the
 * like/unlike dance for every doctype that needs a star toggle.
 */
export const useToggleLike = ({
  doctype,
  name,
  liked,
  onToggled,
}: UseToggleLikeOptions) => {
  const [isLiked, setIsLiked] = useState(liked);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const { call } = useFrappePostCall("frappe.desk.like.toggle_like");

  useEffect(() => {
    setIsLiked(liked);
  }, [liked]);

  const toggle = useCallback(async () => {
    const next = !isLiked;
    setIsLiked(next);
    setIsToggling(true);
    setError(null);
    try {
      await call({ doctype, name, add: next ? "Yes" : "No" });
      onToggled?.(next);
    } catch (err) {
      setIsLiked(!next);
      setError(err);
    } finally {
      setIsToggling(false);
    }
  }, [isLiked, doctype, name, call, onToggled]);

  return { liked: isLiked, isToggling, error, toggle };
};
