/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@next-pms/hooks";

/**
 * Internal dependencies.
 */
import { useScrollRoot } from "@/components/scrollRoot";
import { ProjectTimesheetRow } from "@/components/timesheet-row/projectTimesheetRow";
import { useProjectTimesheet } from "./context";
import type { ProjectWeekSummary } from "./types";
import { useProjectWeekProjects } from "./useProjectWeekProjects";

type ProjectTimesheetWeekProps = {
  week: ProjectWeekSummary;
  defaultExpanded: boolean;
};

export const ProjectTimesheetWeek = ({
  week,
  defaultExpanded,
}: ProjectTimesheetWeekProps) => {
  const filterArgs = useProjectTimesheet(({ state }) => state.filterArgs);
  const isFilterRequest = useProjectTimesheet(
    ({ state }) => state.isFilterRequest,
  );
  const registerProjectRefresh = useProjectTimesheet(
    ({ actions }) => actions.registerProjectRefresh,
  );

  const [enabled, setEnabled] = useState(defaultExpanded);

  const {
    projects,
    hasMore,
    isLoadingProjects,
    isNextPageLoading,
    loadMore,
    refreshEmployeeWeek,
  } = useProjectWeekProjects({
    startDate: week.start_date,
    filterArgs,
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    return registerProjectRefresh(week.start_date, refreshEmployeeWeek);
  }, [enabled, registerProjectRefresh, refreshEmployeeWeek, week.start_date]);

  const scrollRoot = useScrollRoot();
  const loadMoreRef = useInfiniteScroll({
    isLoading: isLoadingProjects || isNextPageLoading,
    hasMore,
    next: loadMore,
    root: scrollRoot,
  });

  return (
    <ProjectTimesheetRow
      label={week.label}
      dates={week.dates}
      collapsed={!defaultExpanded}
      onCollapsedChange={(collapsed) => {
        if (!collapsed) setEnabled(true);
      }}
      projects={projects}
      hasMoreProjects={!isFilterRequest && hasMore}
      isLoadingProjects={
        !isFilterRequest && (isLoadingProjects || isNextPageLoading)
      }
      loadMoreRef={loadMoreRef}
    />
  );
};
