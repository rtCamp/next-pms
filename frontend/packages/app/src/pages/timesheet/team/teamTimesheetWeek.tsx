/**
 * External dependencies.
 */
import { useEffect, useRef, useState } from "react";
import { useInfiniteScroll } from "@next-pms/hooks";

/**
 * Internal dependencies.
 */
import { useScrollRoot } from "@/components/scrollRoot";
import { TeamTimesheetRow } from "@/components/timesheet-row/teamTimesheetRow";
import { useTeamTimesheet } from "./context";
import type { TeamWeekSummary } from "./types";
import { useTeamWeekMembers } from "./useTeamWeekMembers";

type TeamTimesheetWeekProps = {
  week: TeamWeekSummary;
  defaultExpanded: boolean;
  setSelectedTask: (task: string) => void;
  openWeeklyApproval: (employee: string, date: string) => void;
};

export const TeamTimesheetWeek = ({
  week,
  defaultExpanded,
  setSelectedTask,
  openWeeklyApproval,
}: TeamTimesheetWeekProps) => {
  const filterArgs = useTeamTimesheet(({ state }) => state.filterArgs);
  const isFilterRequest = useTeamTimesheet(
    ({ state }) => state.isFilterRequest,
  );
  const registerMemberRefresh = useTeamTimesheet(
    ({ actions }) => actions.registerMemberRefresh,
  );

  const [expanded, setExpanded] = useState(defaultExpanded);
  const activatedRef = useRef(defaultExpanded);

  if (expanded) {
    activatedRef.current = true;
  }
  const enabled = activatedRef.current;

  const {
    members,
    hasMore,
    isLoadingMembers,
    isNextPageLoading,
    loadMore,
    refreshMember,
  } = useTeamWeekMembers({
    startDate: week.start_date,
    filterArgs,
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    return registerMemberRefresh(week.start_date, refreshMember);
  }, [enabled, registerMemberRefresh, refreshMember, week.start_date]);

  const scrollRoot = useScrollRoot();
  const loadMoreRef = useInfiniteScroll({
    isLoading: isLoadingMembers || isNextPageLoading,
    hasMore,
    next: loadMore,
    root: scrollRoot,
  });

  return (
    <TeamTimesheetRow
      label={week.label}
      dates={week.dates}
      collapsed={!defaultExpanded}
      onCollapsedChange={(collapsed) => setExpanded(!collapsed)}
      approvalPendingCount={week.approval_pending_count}
      teamMembers={members}
      hasMoreMembers={!isFilterRequest && hasMore}
      isLoadingMembers={
        !isFilterRequest && (isLoadingMembers || isNextPageLoading)
      }
      loadMoreRef={loadMoreRef}
      setSelectedTask={setSelectedTask}
      openWeeklyApproval={openWeeklyApproval}
    />
  );
};
