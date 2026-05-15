/**
 * External dependencies.
 */
import { useCallback, useMemo, type PropsWithChildren } from "react";
import { type PaginationKey, usePagination } from "@next-pms/hooks";

/**
 * Internal dependencies.
 */
import { PROJECT_LIST_PAGE_SIZE } from "../constants";
import { buildListFrappeFilters, useProjectFilter } from "../context";
import { ProjectListContext, type ProjectListContextProps } from "./context";
import type { ResponseProjectList } from "./types";

export function ProjectListProvider({ children }: PropsWithChildren) {
  const filters = useProjectFilter((c) => c.state.filters);
  const frappeFilters = useMemo(
    () => buildListFrappeFilters(filters),
    [filters],
  );

  const querySignature = useMemo(
    () =>
      JSON.stringify({
        search: filters.search,
        frappeFilters,
        page_length: PROJECT_LIST_PAGE_SIZE,
      }),
    [filters.search, frappeFilters],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: ResponseProjectList | null,
    ): PaginationKey | null => {
      if (previousPageData?.message && !previousPageData.message.has_more) {
        return null;
      }
      return [querySignature, pageIndex] as const;
    },
    [querySignature],
  );

  const { data, error, isLoading, isValidating, size, setSize } =
    usePagination<ResponseProjectList>(
      "next_pms.next_projects.api.project.get_projects_view",
      getKey,
      {
        view: "list",
        search: filters.search,
        filters: frappeFilters,
        page_length: PROJECT_LIST_PAGE_SIZE,
      },
      {
        revalidateOnFocus: false,
        revalidateAll: false,
        revalidateFirstPage: false,
        keepPreviousData: true,
      },
    );

  const projects = useMemo(
    () => (data ?? []).flatMap((page) => page.message?.data ?? []),
    [data],
  );

  const lastPage = data?.at(-1);
  const hasMore = lastPage ? Boolean(lastPage.message?.has_more) : true;
  const isNextPageLoading =
    !isLoading && isValidating && typeof data?.[size - 1] === "undefined";

  const loadMore = useCallback(() => {
    if (isLoading || isNextPageLoading || !hasMore) return;
    void setSize((s) => s + 1);
  }, [isLoading, isNextPageLoading, hasMore, setSize]);

  const value: ProjectListContextProps = useMemo(
    () => ({
      state: {
        data: projects,
        hasMore,
        isLoading,
        error,
      },
      actions: {
        loadMore,
      },
    }),
    [projects, hasMore, isLoading, error, loadMore],
  );

  return (
    <ProjectListContext.Provider value={value}>
      {children}
    </ProjectListContext.Provider>
  );
}
