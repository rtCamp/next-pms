/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useMemo } from "react";

/**
 * Internal dependencies.
 */
import { isCompleteFilterCondition } from "@/lib/utils";
import { useUser } from "@/providers/user";
import {
  PersonalTimesheetContext,
  type PersonalTimesheetContextProps,
} from "./context";
import { usePersonalTimesheetData } from "./usePersonalTimesheetData";
import {
  APPROVAL_STATUS_PARAM_VALUES,
  useTimesheetFilters,
} from "../hooks/useTimesheetFilters";

export const PersonalTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const {
    filters,
    setSearch,
    setApprovalStatus,
    setCompositeFilters,
    resetAll,
  } = useTimesheetFilters({
    includeApprovalStatus: true,
  });

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const effectiveCompositeFilters = useMemo(
    () => filters.compositeFilters.filter(isCompleteFilterCondition),
    [filters.compositeFilters],
  );

  const requestApprovalStatus = useMemo(
    () =>
      // Selecting every status is equivalent to no filter
      filters.approvalStatus?.length === APPROVAL_STATUS_PARAM_VALUES.length
        ? []
        : filters.approvalStatus,
    [filters.approvalStatus],
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
    search: filters.search,
    approvalStatus: requestApprovalStatus,
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
        handleClearAllFilters: resetAll,
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
      resetAll,
      refetchLikedTasks,
    ],
  );

  return (
    <PersonalTimesheetContext.Provider value={value}>
      {children}
    </PersonalTimesheetContext.Provider>
  );
};
