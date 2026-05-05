/**
 * External dependencies.
 */

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
}: InfiniteScrollProps) => {
  const verticalLoderRef = useInfiniteScroll({
    isLoading: isLoading,
    hasMore: hasMore,
    next: () => verticalLodMore(),
  });

  return (
    <div className={className}>
      {children}
      {hasMore && (
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
