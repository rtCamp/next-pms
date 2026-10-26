/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { MANAGER_STAT_HELP } from "@/pages/dashboard/help";
import { AT_RISK_PROJECTS_URL } from "./constants";
import { StatCardSkeleton } from "./skeleton";
import { StatCard } from "./statCard";
import type {
  AtRiskProjectsCountResponse,
  MembersWithoutAllocationResponse,
  OutstandingTimesheetsResponse,
  TimesheetsToReviewResponse,
} from "./types";

export function ManagerStatCards() {
  const { data: atRiskProjectData, isLoading: isAtRiskProjectDataLoading } =
    useFrappeGetCall<AtRiskProjectsCountResponse>(
      "next_pms.api.dashboard.get_at_risk_projects_count",
    );

  const {
    data: membersWithoutAllocationData,
    isLoading: isMembersWithoutAllocationLoading,
  } = useFrappeGetCall<MembersWithoutAllocationResponse>(
    "next_pms.api.dashboard.get_members_without_allocation",
    { days: 7 },
  );

  const {
    data: timesheetsToReviewData,
    isLoading: isTimesheetsToReviewLoading,
  } = useFrappeGetCall<TimesheetsToReviewResponse>(
    "next_pms.api.dashboard.get_timesheets_to_review",
    { days: 7 },
  );

  const {
    data: outstandingTimesheetsData,
    isLoading: isOutstandingTimesheetsLoading,
  } = useFrappeGetCall<OutstandingTimesheetsResponse>(
    "next_pms.api.dashboard.get_outstanding_timesheets",
  );

  return (
    <div className="flex w-full gap-3">
      {isAtRiskProjectDataLoading ? (
        <StatCardSkeleton />
      ) : (
        <StatCard
          className="flex-1 cursor-pointer"
          label="At risk projects"
          help={MANAGER_STAT_HELP.atRiskProjects}
          value={atRiskProjectData?.message ?? "-"}
          to={AT_RISK_PROJECTS_URL}
        />
      )}
      {isMembersWithoutAllocationLoading ? (
        <StatCardSkeleton />
      ) : (
        <StatCard
          className="flex-1"
          label="Members without allocation"
          help={MANAGER_STAT_HELP.membersWithoutAllocation}
          subLabel="this week"
          value={membersWithoutAllocationData?.message?.count ?? "-"}
        />
      )}
      {isTimesheetsToReviewLoading ? (
        <StatCardSkeleton />
      ) : (
        <StatCard
          className="flex-1"
          label="Timesheets to review"
          help={MANAGER_STAT_HELP.timesheetsToReview}
          subLabel="this week"
          value={timesheetsToReviewData?.message?.length ?? "-"}
        />
      )}
      {isOutstandingTimesheetsLoading ? (
        <StatCardSkeleton />
      ) : (
        <StatCard
          className="flex-1"
          label="Outstanding timesheets"
          help={MANAGER_STAT_HELP.outstandingTimesheets}
          value={outstandingTimesheetsData?.message?.count ?? "-"}
        />
      )}
    </div>
  );
}
