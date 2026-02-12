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

/**
 * This hook provides the ref which is used to check whether the target element is render/visible on page or not.
 *
 * @param props.isLoading It is used to check whether the data is loading or not.
 * @param props.root The element that is used as the viewport for checking visibility of the target.
 * @param props.rootMarg In the same way that CSS margin works, you can specify values for the top, right, bottom, and left edges.
 * @param props.hasMore It is used to check whether there is more data to load or not.
 * @param props.next It will be called the next function when the target element is render/visible.
 * @param props.threshold It is used to specify the percentage of the target's visibility the observer's callback should be executed.
 * @returns React.Ref
 */
function useInfiniteScroll({
  isLoading = false,
  hasMore,
  next,
  threshold = 0.02,
  root = null,
  rootMargin = "0px",
}: InfiniteScrollProps) {
  const observer = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef(false);

  const observerRef = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      observer.current?.disconnect();

      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasMore && !isFetchingRef.current) {
            isFetchingRef.current = true;
            next();
          }
        },
        {
          root,
          rootMargin,
          threshold,
        },
      );

      observer.current.observe(element);
    },
    [hasMore, next, threshold, root, rootMargin],
  );
  if (!isLoading) {
    isFetchingRef.current = false;
  }

  return observerRef;
}

export { useInfiniteScroll };
