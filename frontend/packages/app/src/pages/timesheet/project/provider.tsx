/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { isCompleteFilterCondition, parseFrappeErrorMsg } from "@/lib/utils";
import {
  ProjectTimesheetContext,
  type ProjectTimesheetContextProps,
} from "./context";
import { useProjectTimesheetData } from "./useProjectTimesheetData";
import { useTimesheetFilters } from "../hooks/useTimesheetFilters";

export const ProjectTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const toast = useToasts();
  const [isFilterRequest, setIsFilterRequest] = useState(false);
  const { filters, setSearch, setCompositeFilters } = useTimesheetFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, filters.search, setSearch]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Only pass complete filter conditions to the data hook so that selecting a
  // field (without an operator/value) does not trigger a reset + network request.
  const effectiveCompositeFilters = useMemo(
    () => filters.compositeFilters.filter(isCompleteFilterCondition),
    [filters.compositeFilters],
  );
  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        search: filters.search,
        compositeFilters: effectiveCompositeFilters,
      }),
    [effectiveCompositeFilters, filters.search],
  );
  const previousFilterSignatureRef = useRef(filterSignature);

  useEffect(() => {
    if (previousFilterSignatureRef.current === filterSignature) {
      return;
    }

    setIsFilterRequest(true);
    previousFilterSignatureRef.current = filterSignature;
  }, [filterSignature]);

  const {
    hasMore,
    isLoadingProjectData,
    weekGroups: freshWeekGroups,
    loadData,
    error,
  } = useProjectTimesheetData({
    search: filters.search,
    compositeFilters: effectiveCompositeFilters,
  });

  // Keep the last non-empty result so that during a filter-triggered reload the
  // table stays visible (faded) instead of blinking through an empty state and
  // triggering the full-page spinner.
  const staleWeekGroupsRef = useRef(freshWeekGroups);
  if (freshWeekGroups.length > 0) {
    staleWeekGroupsRef.current = freshWeekGroups;
  }
  const weekGroups =
    freshWeekGroups.length > 0 || !isLoadingProjectData
      ? freshWeekGroups
      : staleWeekGroupsRef.current;

  useEffect(() => {
    if (isLoadingProjectData) return;
    setIsFilterRequest(false);

    if (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProjectData, error]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const value: ProjectTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMore,
        isLoadingProjectData,
        isFilterRequest,
        weekGroups,
        filters: {
          search: filters.search,
        },
        searchInput,
        compositeFilters: filters.compositeFilters,
      },
      actions: {
        loadData,
        handleSearchChange,
        handleCompositeFilterChange: setCompositeFilters,
      },
    }),
    [
      hasMore,
      isLoadingProjectData,
      isFilterRequest,
      loadData,
      weekGroups,
      filters.search,
      filters.compositeFilters,
      searchInput,
      handleSearchChange,
      setCompositeFilters,
    ],
  );

  return (
    <ProjectTimesheetContext.Provider value={value}>
      {children}
    </ProjectTimesheetContext.Provider>
  );
};
