/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { type FilterCondition, useToasts } from "@rtcamp/frappe-ui-react";
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
import {
  createInitialProjectTimesheetState,
  projectTimesheetReducer,
} from "./reducer";
import { useProjectTimesheetData } from "./useProjectTimesheetData";

export const ProjectTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const toast = useToasts();

  const [state, dispatch] = useReducer(
    projectTimesheetReducer,
    undefined,
    createInitialProjectTimesheetState,
  );

  const debouncedSearch = useDebounce(state.searchInput, 400);

  // Only pass complete filter conditions to the data hook so that selecting a
  // field (without an operator/value) does not trigger a reset + network request.
  const effectiveCompositeFilters = useMemo(
    () => state.compositeFilters.filter(isCompleteFilterCondition),
    [state.compositeFilters],
  );

  const {
    hasMore,
    isLoadingProjectData,
    weekGroups: freshWeekGroups,
    loadData,
    error,
  } = useProjectTimesheetData({
    search: debouncedSearch,
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
    dispatch({ type: "FILTER_REQUEST_COMPLETE" });

    if (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProjectData, error]);

  const handleSearchChange = useCallback((value: string) => {
    dispatch({ type: "SEARCH_CHANGED", payload: value });
  }, []);

  const handleCompositeFilterChange = useCallback(
    (value: FilterCondition[]) => {
      dispatch({ type: "COMPOSITE_FILTERS_CHANGED", payload: value });
    },
    [],
  );

  const value: ProjectTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMore,
        isLoadingProjectData,
        isFilterRequest: state.isFilterRequest,
        weekGroups,
        searchInput: state.searchInput,
        compositeFilters: state.compositeFilters,
      },
      actions: {
        loadData,
        handleSearchChange,
        handleCompositeFilterChange,
      },
    }),
    [
      hasMore,
      isLoadingProjectData,
      state.isFilterRequest,
      loadData,
      weekGroups,
      state.searchInput,
      state.compositeFilters,
      handleSearchChange,
      handleCompositeFilterChange,
    ],
  );

  return (
    <ProjectTimesheetContext.Provider value={value}>
      {children}
    </ProjectTimesheetContext.Provider>
  );
};
