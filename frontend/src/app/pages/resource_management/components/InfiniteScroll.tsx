/**
 * External dependencies.
 */
import { ReactNode } from "react";

/**
 * Internal dependencies.
 */
import { Skeleton } from "@/app/components/ui/skeleton";
import { TableCell, TableRow } from "@/app/components/ui/table";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

interface InfiniteScrollProps {
  children: ReactNode;
  isLoading: boolean;
  hasMore: boolean;
  verticalLodMore: () => void;
}

const InfiniteScroll = ({ children, isLoading, hasMore, verticalLodMore }: InfiniteScrollProps) => {
  const verticalLoderRef = useInfiniteScroll({ isLoading: isLoading, hasMore: hasMore, next: () => verticalLodMore() });

  return (
    <>
      {children}
      {hasMore && (
        <TableRow ref={verticalLoderRef} className="relative">
          <TableCell colSpan={30000} className="p-0 sticky left-0 h-30">
              <Skeleton className="h-10 w-full rounded-none  bg-red-400" />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export { InfiniteScroll };
