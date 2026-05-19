/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { type PaginationKey, usePagination } from "@next-pms/hooks";

/**
 * Internal dependencies.
 */
import AddProjectModal from "../components/add-project";
import { PROJECT_LIST_PAGE_SIZE } from "../constants";
import { buildListFrappeFilters } from "../utils";
import { ProjectListContext, type ProjectListContextProps } from "./context";
import type { ResponseProjectList } from "./types";
import { useProjectFilters } from "../hooks/useProjectFilters";

export function ProjectListProvider({ children }: PropsWithChildren) {
  const { filters } = useProjectFilters();
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const openAddProjectModal = useCallback(() => setAddProjectOpen(true), []);
  const closeAddProjectModal = useCallback(() => setAddProjectOpen(false), []);
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

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
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
        addProjectOpen,
      },
      actions: {
        loadMore,
        openAddProjectModal,
        closeAddProjectModal,
      },
    }),
    [
      projects,
      hasMore,
      isLoading,
      error,
      loadMore,
      addProjectOpen,
      openAddProjectModal,
      closeAddProjectModal,
    ],
  );

  return (
    <ProjectListContext.Provider value={value}>
      {children}
      <AddProjectModal
        open={addProjectOpen}
        onOpenChange={setAddProjectOpen}
        onSuccess={() => mutate()}
      />
    </ProjectListContext.Provider>
  );
}
