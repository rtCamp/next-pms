/**
 * External dependencies.
 */

import { useInfiniteScroll } from "@next-pms/hooks";
import { Skeleton } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { InfiniteScrollProps } from "./types";

const InfiniteScroll = ({ children, isLoading, hasMore, verticalLodMore, className }: InfiniteScrollProps) => {
  const verticalLoderRef = useInfiniteScroll({ isLoading: isLoading, hasMore: hasMore, next: () => verticalLodMore() });

  return (
    <div className={className}>
      {children}
      {hasMore && (
        <div
          ref={verticalLoderRef}
          className="flex flex-col items-start w-full sticky left-0 h-30"
        >
          <Skeleton className="h-10 w-full rounded-none" />
        </div>
      )}
    </div>
  );
};

export { InfiniteScroll };
