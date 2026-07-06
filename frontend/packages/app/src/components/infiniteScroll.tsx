/**
 * External dependencies.
 */

import { useEffect, useRef } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { useInfiniteScroll } from "@next-pms/hooks";
import { Skeleton } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { InfiniteScrollProps } from "./types";

const InfiniteScroll = ({
  children,
  isLoading,
  hasMore,
  verticalLodMore,
  className,
  skeletonClassName,
  count = 1,
  scrollResetKey,
}: InfiniteScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const verticalLoderRef = useInfiniteScroll({
    isLoading: isLoading,
    hasMore: hasMore,
    next: () => verticalLodMore(),
  });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [scrollResetKey]);

  return (
    <div ref={containerRef} className={className}>
      {children}
      {(isLoading || hasMore) && (
        <div
          ref={verticalLoderRef}
          className="flex flex-col items-start w-full sticky left-0 h-30 gap-px"
        >
          {Array.from({ length: count }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                "h-11.25 shrink-0 w-full rounded-none",
                skeletonClassName,
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { InfiniteScroll };
