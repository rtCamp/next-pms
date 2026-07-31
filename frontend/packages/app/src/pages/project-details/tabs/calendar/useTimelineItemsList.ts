/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { type PaginationKey, usePagination } from "@next-pms/hooks";

/**
 * Internal dependencies.
 */
import { TIMELINE_LIST_PAGE_SIZE } from "./constants";
import type { ApiTimelineItemsResponse, TimelineItemType } from "./types";
import { mapTimelineItem } from "./utils";

type ListPage = { message: ApiTimelineItemsResponse };

export function useTimelineItemsList(
  projectId: string,
  type: TimelineItemType,
  search: string,
  enabled: boolean,
) {
  const querySignature = useMemo(
    () => JSON.stringify({ projectId, type, search, enabled }),
    [projectId, type, search, enabled],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: ListPage | null,
    ): PaginationKey | null => {
      if (!enabled || !projectId) return null;
      if (previousPageData && !previousPageData.message.has_more) return null;
      return [querySignature, pageIndex] as const;
    },
    [enabled, projectId, querySignature],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    usePagination<ListPage>(
      "next_pms.next_projects.api.project_timeline_item.get_project_timeline_items",
      getKey,
      {
        project: projectId,
        type,
        search: search || undefined,
        page_length: TIMELINE_LIST_PAGE_SIZE,
      },
      {
        revalidateOnFocus: false,
        revalidateAll: false,
        revalidateFirstPage: false,
        keepPreviousData: false,
      },
    );

  const items = useMemo(
    () =>
      (data ?? []).flatMap((page) => page.message.data.map(mapTimelineItem)),
    [data],
  );

  const lastPage = data?.at(-1);
  const hasMore = lastPage ? lastPage.message.has_more : true;
  const isNextPageLoading =
    !isLoading && isValidating && typeof data?.[size - 1] === "undefined";

  const loadMore = useCallback(() => {
    if (isLoading || isNextPageLoading || !hasMore) return;
    setSize((s) => s + 1);
  }, [isLoading, isNextPageLoading, hasMore, setSize]);

  return { items, hasMore, isLoading, error, loadMore, mutate };
}
