/**
 * External dependencies.
 */
import { useCallback, useMemo, type PropsWithChildren } from "react";
import { type PaginationKey, usePagination } from "@next-pms/hooks";

/**
 * Internal dependencies.
 */
import { useFrappeDocTypeEventListener } from "frappe-react-sdk";
import { useProjectFilters } from "../components/project-filters/useProjectFilters";
import { PROJECT_LIST_PAGE_SIZE, PROJECTS_VIEW_METHOD } from "../constants";
import { ProjectListContext, type ProjectListContextProps } from "./context";
import { buildListFrappeFilters } from "../utils";
import type { ResponseProjectList } from "./types";

export function ProjectListProvider({ children }: PropsWithChildren) {
  const { filters, sort } = useProjectFilters();
  const frappeFilters = useMemo(
    () => buildListFrappeFilters(filters),
    [filters],
  );

  const querySignature = useMemo(
    () =>
      JSON.stringify({
        method: PROJECTS_VIEW_METHOD,
        search: filters.search,
        frappeFilters,
        order_by: sort.field + " " + sort.order,
        page_length: PROJECT_LIST_PAGE_SIZE,
      }),
    [filters.search, frappeFilters, sort.field, sort.order],
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

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    usePagination<ResponseProjectList>(
      PROJECTS_VIEW_METHOD,
      getKey,
      {
        view: "list",
        search: filters.search,
        filters: frappeFilters,
        order_by: sort.field + " " + sort.order,
        page_length: PROJECT_LIST_PAGE_SIZE,
      },
      {
        revalidateOnFocus: false,
        revalidateAll: false,
        revalidateFirstPage: false,
        keepPreviousData: false,
      },
    );

  useFrappeDocTypeEventListener("Project", () => {
    mutate();
  });

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
