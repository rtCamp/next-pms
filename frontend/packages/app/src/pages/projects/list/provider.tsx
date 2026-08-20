/**
 * External dependencies.
 */
import { useCallback, useMemo, type PropsWithChildren } from "react";
import { type PaginationKey, usePagination } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import {
  type FrappeError,
  useFrappeDocTypeEventListener,
} from "frappe-react-sdk";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectFilters } from "../components/project-filters/useProjectFilters";
import { PROJECT_LIST_PAGE_SIZE, PROJECTS_VIEW_METHOD } from "../constants";
import { ProjectListContext, type ProjectListContextProps } from "./context";
import { buildListFrappeFilters } from "../utils";
import type { ResponseProjectList } from "./types";

export function ProjectListProvider({ children }: PropsWithChildren) {
  const toast = useToasts();
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
        currency: filters.currency,
      }),
    [filters.search, frappeFilters, sort.field, sort.order, filters.currency],
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
        currency: filters.currency,
      },
      {
        revalidateOnFocus: false,
        revalidateAll: false,
        revalidateFirstPage: false,
        keepPreviousData: true,
        onError: (err) => {
          toast.error(parseFrappeErrorMsg(err as FrappeError), {
            id: "project-list-fetch-error",
          });
        },
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
  const isInitialLoad = isLoading && (data?.length ?? 0) === 0;
  const isFilterRequest = isLoading && (data?.length ?? 0) > 0;

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
        isInitialLoad,
        isFilterRequest,
        error,
      },
      actions: {
        loadMore,
      },
    }),
    [
      projects,
      hasMore,
      isLoading,
      isInitialLoad,
      isFilterRequest,
      error,
      loadMore,
    ],
  );

  return (
    <ProjectListContext.Provider value={value}>
      {children}
    </ProjectListContext.Provider>
  );
}
