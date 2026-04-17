/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type ApprovalStatusType } from "@next-pms/design-system/components";
import { type FilterCondition } from "@rtcamp/frappe-ui-react";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useDebounce } from "@/hooks/useDebounce";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { TimesheetFilters } from "@/types/timesheet";
import {
  TeamTimesheetContext,
  type TeamTimesheetContextProps,
} from "./context";
import { useTeamTimesheetData } from "./useTeamTimesheetData";

export const TeamTimesheetProvider: FC<PropsWithChildren> = ({ children }) => {
  const toast = useToasts();
  const [employee, setEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isWeeklyApprovalOpen, setIsWeeklyApprovalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const [filters, setFilters] = useState<Omit<TimesheetFilters, "search">>({
    approvalStatus: undefined,
    reportsTo: undefined,
  });

  const debouncedSearch = useDebounce(searchInput, 400);

  // Compute the full filters object with the debounced search.
  // Use employeeId as the default for reportsTo until the user changes it.
  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
      reportsTo: (filters.reportsTo ?? employeeId) || undefined,
    }),
    [filters, debouncedSearch, employeeId],
  );

  const { hasMore, isLoadingTeamData, weekGroups, loadMore, error } =
    useTeamTimesheetData({
      filters: effectiveFilters,
      compositeFilters,
    });

  useEffect(() => {
    if (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [error]);

  const openWeeklyApproval = useCallback((employeeId: string, date: string) => {
    setEmployee(employeeId);
    setStartDate(date);
    setIsWeeklyApprovalOpen(true);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleApprovalStatusChange = useCallback(
    (value?: ApprovalStatusType | null) => {
      setFilters((prev) => ({
        ...prev,
        approvalStatus: value ?? undefined,
      }));
    },
    [],
  );

  const handleReportsToChange = useCallback((value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      reportsTo: value ?? undefined,
    }));
  }, []);

  const handleCompositeFilterChange = useCallback(
    (value: FilterCondition[]) => {
      setCompositeFilters(value);
    },
    [],
  );

  const value: TeamTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMore,
        isLoadingTeamData,
        weekGroups,
        isWeeklyApprovalOpen,
        employee,
        startDate,
        filters: effectiveFilters,
        searchInput,
        compositeFilters,
      },
      actions: {
        loadMore,
        openWeeklyApproval,
        setIsWeeklyApprovalOpen,
        handleSearchChange,
        handleApprovalStatusChange,
        handleReportsToChange,
        handleCompositeFilterChange,
      },
    }),
    [
      hasMore,
      isLoadingTeamData,
      loadMore,
      weekGroups,
      openWeeklyApproval,
      employee,
      startDate,
      isWeeklyApprovalOpen,
      effectiveFilters,
      searchInput,
      compositeFilters,
      handleSearchChange,
      handleApprovalStatusChange,
      handleReportsToChange,
      handleCompositeFilterChange,
    ],
  );

  return (
    <TeamTimesheetContext.Provider value={value}>
      {children}
    </TeamTimesheetContext.Provider>
  );
};
