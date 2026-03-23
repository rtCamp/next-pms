/**
 * External dependencies.
 */

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
              className="h-11.25 shrink-0 w-full rounded-none"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { InfiniteScroll };
