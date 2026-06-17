/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useMemo } from "react";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { isCompleteFilterCondition } from "@/lib/utils";
import { useUser } from "@/providers/user";
import {
  PersonalTimesheetContext,
  type PersonalTimesheetContextProps,
} from "./context";
import { usePersonalTimesheetData } from "./usePersonalTimesheetData";
import { useTimesheetFilters } from "../hooks/useTimesheetFilters";

export const PersonalTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const { filters, setSearch, setApprovalStatus, setCompositeFilters } =
    useTimesheetFilters({
      includeApprovalStatus: true,
    });
  const debouncedSearch = useDebounce(filters.search, 400);

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const effectiveCompositeFilters = useMemo(
    () => filters.compositeFilters.filter(isCompleteFilterCondition),
    [filters.compositeFilters],
  );

  const activeFilterKey = useMemo(
    () =>
      JSON.stringify({
        search: debouncedSearch,
        approvalStatus: filters.approvalStatus ?? "",
        compositeFilters: effectiveCompositeFilters,
      }),
    [debouncedSearch, filters.approvalStatus, effectiveCompositeFilters],
  );
  const {
    hasMoreWeeks,
    isLoadingPersonalData,
    isInitialLoad,
    isFilterRequest,
    timesheetData,
    likedTaskData,
    loadData,
    refetchLikedTasks,
  } = usePersonalTimesheetData({
    employeeId,
    requestKey: activeFilterKey,
    search: debouncedSearch,
    approvalStatus: filters.approvalStatus,
    compositeFilters: effectiveCompositeFilters,
  });

  const value: PersonalTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMoreWeeks,
        isLoadingPersonalData,
        isInitialLoad,
        isFilterRequest,
        timesheetData,
        filters: {
          search: filters.search,
          approvalStatus: filters.approvalStatus,
        },
        compositeFilters: filters.compositeFilters,
        likedTaskData,
      },
      actions: {
        loadData,
        handleSearchChange: setSearch,
        handleApprovalStatusChange: setApprovalStatus,
        handleCompositeFilterChange: setCompositeFilters,
        refetchLikedTasks,
      },
    }),
    [
      hasMoreWeeks,
      isLoadingPersonalData,
      isInitialLoad,
      isFilterRequest,
      timesheetData,
      likedTaskData,
      loadData,
      filters.search,
      filters.approvalStatus,
      filters.compositeFilters,
      setSearch,
      setApprovalStatus,
      setCompositeFilters,
      refetchLikedTasks,
    ],
  );

  return (
    <PersonalTimesheetContext.Provider value={value}>
      {children}
    </PersonalTimesheetContext.Provider>
  );
};
