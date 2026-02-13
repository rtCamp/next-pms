/**
 * External dependencies.
 */
import { Skeleton } from "@next-pms/design-system/components";
import { useInfiniteScroll } from "@next-pms/hooks";
import { mergeClassNames } from "@/lib/utils";
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
}: InfiniteScrollProps) => {
  const verticalLoderRef = useInfiniteScroll({
    isLoading: isLoading,
    hasMore: hasMore,
    next: () => verticalLodMore(),
  });

  return (
    <div>
      {children}
      {hasMore && (
        <div
          ref={verticalLoderRef}
          className={mergeClassNames(
            "flex flex-col items-start w-screen sticky left-0 h-30",
            className,
          )}
        >
          <Skeleton className="h-10 w-full rounded-none" />
        </div>
      )}
    </div>
  );
};

export { InfiniteScroll };
