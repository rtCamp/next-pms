/**
 * External dependencies.
 */
import { ReactNode } from "react";
import { useInfiniteScroll } from "@next-pms/hooks";
/**
 * Internal dependencies.
 */
import { Skeleton } from "@/app/components/ui/skeleton";


interface InfiniteScrollProps {
  children: ReactNode;
  isLoading: boolean;
  hasMore: boolean;
  verticalLodMore: () => void;
}

const InfiniteScroll = ({ children, isLoading, hasMore, verticalLodMore }: InfiniteScrollProps) => {
  const verticalLoderRef = useInfiniteScroll({ isLoading: isLoading, hasMore: hasMore, next: () => verticalLodMore() });

  return (
    <div>
      {children}
      {hasMore && (
        <div ref={verticalLoderRef} className="flex flex-col items-start w-screen sticky left-0 h-30">
          <Skeleton className="h-10 w-full rounded-none  bg-gray-200" />
        </div>
      )}
    </div>
  );
};

export { InfiniteScroll };
