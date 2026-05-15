/**
 * External dependencies.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { kebabToTitleCase } from "@/lib/utils";

import { PROJECT_LIST_PAGE_SIZE } from "./constants";
import {
  ProjectListContext,
  initialProjectListFilters,
  type ProjectListContextProps,
  type ProjectListFilters,
  type ProjectStatus,
  type RagStatus,
} from "./context";
import type { Phase, ProjectListItem, ResponseProject } from "./types";

const buildListFrappeFilters = (filters: ProjectListFilters) => {
  const out: unknown[] = [];
  if (filters.ragStatus) {
    out.push(["custom_project_rag_status", "=", filters.ragStatus]);
  }
  if (filters.phase) {
    out.push(["custom_project_phase", "=", filters.phase]);
  }
  if (filters.status) {
    out.push(["status", "=", filters.status]);
  }
  return out;
};

export function ProjectListProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<ProjectListFilters>(
    initialProjectListFilters,
  );
  const [start, setStart] = useState(0);
  const [pageMap, setPageMap] = useState<Map<number, ProjectListItem[]>>(
    () => new Map(),
  );
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const frappeFilters = useMemo(
    () => buildListFrappeFilters(filters),
    [filters],
  );

  const { data, error, isLoading, mutate } = useFrappeGetCall<ResponseProject>(
    "next_pms.next_projects.api.project.get_projects_view",
    {
      search: filters.search,
      filters: frappeFilters,
      start,
      limit: PROJECT_LIST_PAGE_SIZE,
    },
  );

  const lastDataRef = useRef<typeof data>(undefined);
  useEffect(() => {
    if (!data?.message || data === lastDataRef.current) return;
    lastDataRef.current = data;
    const page = data.message.data;
    setPageMap((prev) => {
      const next = new Map(prev);
      next.set(start, page);
      return next;
    });
    setHasMore(data.message.has_more);
    setTotalCount(data.message.total_count);
  }, [data, start]);

  const resetPagination = useCallback(() => {
    lastDataRef.current = undefined;
    setStart(0);
    setPageMap(new Map());
    setHasMore(false);
  }, []);

  const setSearch = useCallback(
    (search: string) => {
      resetPagination();
      setFilters((f) => ({ ...f, search }));
    },
    [resetPagination],
  );
  const setRagStatus = useCallback(
    (ragStatus: RagStatus | undefined) => {
      resetPagination();
      setFilters((f) => ({ ...f, ragStatus }));
    },
    [resetPagination],
  );
  const setPhase = useCallback(
    (phase: Phase | undefined) => {
      resetPagination();
      setFilters((f) => ({ ...f, phase }));
    },
    [resetPagination],
  );
  const setStatus = useCallback(
    (status: ProjectStatus | undefined) => {
      resetPagination();
      setFilters((f) => ({ ...f, status }));
    },
    [resetPagination],
  );
  const setAdvanced = useCallback(
    (advanced: FilterCondition[]) => {
      resetPagination();
      setFilters((f) => ({ ...f, advanced }));
    },
    [resetPagination],
  );
  const resetFilters = useCallback(() => {
    resetPagination();
    setFilters(initialProjectListFilters);
  }, [resetPagination]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setStart((s) => s + PROJECT_LIST_PAGE_SIZE);
  }, [isLoading, hasMore]);

  const { updateDoc } = useFrappeUpdateDoc();
  const updateProjectPhase = useCallback(
    async (projectId: string, phase: Phase) => {
      await updateDoc("Project", projectId, {
        custom_project_phase: kebabToTitleCase(phase),
      });
      resetPagination();
      mutate();
    },
    [updateDoc, resetPagination, mutate],
  );

  const flatData = useMemo(() => {
    const offsets = Array.from(pageMap.keys()).sort((a, b) => a - b);
    return offsets.flatMap((k) => pageMap.get(k)!);
  }, [pageMap]);

  const value: ProjectListContextProps = useMemo(
    () => ({
      state: {
        filters,
        data: flatData,
        totalCount,
        hasMore,
        isLoading,
        error,
      },
      actions: {
        setSearch,
        setRagStatus,
        setPhase,
        setStatus,
        setAdvanced,
        resetFilters,
        loadMore,
        updateProjectPhase,
      },
    }),
    [
      filters,
      flatData,
      totalCount,
      hasMore,
      isLoading,
      error,
      setSearch,
      setRagStatus,
      setPhase,
      setStatus,
      setAdvanced,
      resetFilters,
      loadMore,
      updateProjectPhase,
    ],
  );

  return (
    <ProjectListContext.Provider value={value}>
      {children}
    </ProjectListContext.Provider>
  );
}
