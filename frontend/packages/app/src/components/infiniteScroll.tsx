/**
 * External dependencies.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@base-ui/react/scroll-area";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { useInfiniteScroll } from "@next-pms/hooks";
import { Skeleton } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { ScrollRootContext } from "./scrollRoot";
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
  showScrollbar = true,
  scrollbarVisibility = "always",
  scrollbarVariant = "classic",
  enableScrollArea = false,
}: InfiniteScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);
  const observerRoot = enableScrollArea || className ? containerElement : null;
  const verticalLoderRef = useInfiniteScroll({
    isLoading: isLoading,
    hasMore: hasMore,
    next: () => verticalLodMore(),
    root: observerRoot,
  });

  const handleViewportRef = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
    setContainerElement(element);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  }, [scrollResetKey]);

  const content = (
    <ScrollRootContext.Provider value={observerRoot}>
      {children}
      {(isLoading || hasMore) && (
        <div
          ref={verticalLoderRef}
          className="flex flex-col items-start w-full sticky left-0 gap-px"
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
    </ScrollRootContext.Provider>
  );

  if (!enableScrollArea) {
    return (
      <div ref={handleViewportRef} className={className}>
        {content}
      </div>
    );
  }

  return (
    <ScrollArea.Root className={cn("relative h-full w-full", className)}>
      <ScrollArea.Viewport
        ref={handleViewportRef}
        tabIndex={-1}
        className={cn("h-full w-full", {
          "w-[calc(100%-var(--spacing)*1.5)]":
            showScrollbar && scrollbarVariant === "classic",
          "h-[calc(100%-var(--spacing)*1.5)]":
            showScrollbar && scrollbarVariant === "classic",
        })}
      >
        <ScrollArea.Content className="min-h-full">
          {content}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      {showScrollbar ? (
        <>
          <ScrollArea.Scrollbar
            className={cn(
              "z-20 flex w-1.5 cursor-pointer justify-center bg-transparent",
              scrollbarVisibility === "hover"
                ? "opacity-0 transition-opacity duration-150 data-hovering:opacity-100 data-scrolling:opacity-100"
                : "opacity-100 animate-fade-in",
            )}
          >
            <ScrollArea.Thumb className="w-full cursor-pointer rounded-[54px] bg-surface-gray-4" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            orientation="horizontal"
            className={cn(
              "z-20 flex h-1.5 cursor-pointer items-center bg-transparent",
              scrollbarVisibility === "hover"
                ? "opacity-0 transition-opacity duration-150 data-hovering:opacity-100 data-scrolling:opacity-100"
                : "opacity-100 animate-fade-in",
            )}
          >
            <ScrollArea.Thumb className="h-full cursor-pointer rounded-[54px] bg-surface-gray-4" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Corner className="bg-transparent" />
        </>
      ) : null}
    </ScrollArea.Root>
  );
};

export { InfiniteScroll };
