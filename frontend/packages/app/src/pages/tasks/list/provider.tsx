/**
 * External dependencies.
 */
import { useCallback, useMemo, type PropsWithChildren } from "react";
import { type PaginationKey, usePagination } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { type FrappeError, useFrappeDeleteDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { buildFilterConditions, parseFrappeErrorMsg } from "@/lib/utils";
import { TASK_LIST_PAGE_SIZE } from "../constants";
import { TaskListContext, type TaskListContextProps } from "./context";
import type { ResponseTaskList } from "./types";
import { useTaskFilters } from "../useTaskFilters";

export function TaskListProvider({ children }: PropsWithChildren) {
  const toast = useToasts();
  const { deleteDoc } = useFrappeDeleteDoc();
  const { filters, sort } = useTaskFilters();
  const frappeFilters = useMemo(
    () => buildFilterConditions(filters.advanced),
    [filters.advanced],
  );

  const querySignature = useMemo(
    () =>
      JSON.stringify({
        search: filters.search,
        project: filters.project,
        status: filters.status,
        frappeFilters,
        order_by: sort.field ? `${sort.field} ${sort.order}` : undefined,
        page_length: TASK_LIST_PAGE_SIZE,
      }),
    [
      filters.search,
      filters.project,
      filters.status,
      frappeFilters,
      sort.field,
      sort.order,
    ],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: ResponseTaskList | null,
    ): PaginationKey | null => {
      if (previousPageData?.message && !previousPageData.message.has_more) {
        return null;
      }
      return [querySignature, pageIndex] as const;
    },
    [querySignature],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    usePagination<ResponseTaskList>(
      "next_pms.timesheet.api.task.get_task_list",
      getKey,
      {
        search: filters.search,
        projects: filters.project ? [filters.project] : undefined,
        status: filters.status.length ? filters.status : undefined,
        filters: frappeFilters,
        order_by: sort.field ? `${sort.field} ${sort.order}` : undefined,
        page_length: TASK_LIST_PAGE_SIZE,
      },
      {
        revalidateOnFocus: false,
        revalidateAll: false,
        revalidateFirstPage: false,
        keepPreviousData: false,
      },
    );

  const tasks = useMemo(
    () => (data ?? []).flatMap((page) => page.message?.task ?? []),
    [data],
  );

  const lastPage = data?.at(-1);
  const hasMore = lastPage ? Boolean(lastPage.message?.has_more) : true;
  const isNextPageLoading =
    !isLoading && isValidating && typeof data?.[size - 1] === "undefined";

  const loadMore = useCallback(() => {
    if (isLoading || isNextPageLoading || !hasMore) return;
    setSize((s) => s + 1);
  }, [isLoading, isNextPageLoading, hasMore, setSize]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const deleteTask = useCallback(
    async (name: string) => {
      try {
        await deleteDoc("Task", name);
        refresh();
        toast.success("Task deleted");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [deleteDoc, refresh],
  );

  const value: TaskListContextProps = useMemo(
    () => ({
      state: {
        data: tasks,
        hasMore,
        isLoading,
        error,
      },
      actions: {
        loadMore,
        refresh,
        deleteTask,
      },
    }),
    [tasks, hasMore, isLoading, error, loadMore, refresh, deleteTask],
  );

  return (
    <TaskListContext.Provider value={value}>
      {children}
    </TaskListContext.Provider>
  );
}
