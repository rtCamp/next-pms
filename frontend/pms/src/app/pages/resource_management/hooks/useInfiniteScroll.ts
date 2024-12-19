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
 * This hooks provide the Ref which is used to check whether the target element is visible or not.
 * 
 * @param props.isLoading It is used to check whether the data is loading or not.
 * @param props.root The element that is used as the viewport for checking visibility of the target.
 * @param props.rootMarg In the same way that CSS margin works, you can specify values for the top, right, bottom, and left edges.
 * @param props.hasMore It is used to check whether there is more data to load or not.
 * @param props.next It is used to call the next function.
 * @param props.threshold It is used to specify the percentage of the target's visibility the observer's callback should be executed.
 * @returns React.Ref
 */
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
