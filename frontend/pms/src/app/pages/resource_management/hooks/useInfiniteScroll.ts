/**
 * External dependencies.
 */
import { useCallback, useRef } from "react";

interface InfiniteScrollProps {
  isLoading?: boolean;
  hasMore: boolean;
  next: () => unknown;
  threshold?: number;
  root?: Element | Document | null;
  rootMargin?: string;
  reverse?: boolean;
  children?: React.ReactNode;
}

function useInfiniteScroll({
  isLoading,
  hasMore,
  next,
  threshold = 1,
  root = null,
  rootMargin = "0px",
}: InfiniteScrollProps) {
  const observer = useRef<IntersectionObserver>();
  // This callback ref will be called when it is dispatched to an element or detached from an element,
  // or when the callback function changes.
  const observerRef = useCallback(
    (element: HTMLElement | null) => {
      let safeThreshold = threshold;
      if (threshold < 0 || threshold > 1) {
        safeThreshold = 1;
      }
      // When isLoading is true, this callback will do nothing.
      // It means that the next function will never be called.
      // It is safe because the intersection observer has disconnected the previous element.
      if (isLoading) return;

      if (observer.current) observer.current.disconnect();
      if (!element) return;

      // Create a new IntersectionObserver instance because hasMore or next may be changed.
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            next();
          }
        },
        { threshold: safeThreshold, root, rootMargin }
      );
      observer.current.observe(element);
    },
    [hasMore, isLoading, next, threshold, root, rootMargin]
  );

  return observerRef;
}

export { useInfiniteScroll };
