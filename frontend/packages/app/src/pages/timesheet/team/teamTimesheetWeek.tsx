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
  const weekRef = useRef<HTMLDivElement>(null);

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

  const handleCollapsedChange = (collapsed: boolean) => {
    setExpanded(!collapsed);
    if (collapsed) {
      // Prevents the page from jumping up when the collapsed week's rows disappear.
      weekRef.current?.scrollIntoView({ block: "start" });
    }
  };

  return (
    <div ref={weekRef} className="scroll-mt-7">
      <TeamTimesheetRow
        label={week.label}
        dates={week.dates}
        collapsed={!defaultExpanded}
        onCollapsedChange={handleCollapsedChange}
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
    </div>
  );
};
