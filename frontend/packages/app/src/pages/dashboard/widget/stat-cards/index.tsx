/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { StatCardSkeleton } from "./skeleton";
import { StatCard } from "./stat-card";
import {
  ActiveProjectsCountResponse,
  AtRiskProjectsCountResponse,
  MembersWithoutAllocationResponse,
  NonBillableHoursResponse,
} from "./types";

export default function StatCards() {
  const { data: activeProjectData, isLoading: isActiveProjectDataLoading } =
    useFrappeGetCall<ActiveProjectsCountResponse>(
      "next_pms.api.dashboard.get_active_projects_count",
    );

  const { data: atRiskProjectData, isLoading: isAtRiskProjectDataLoading } =
    useFrappeGetCall<AtRiskProjectsCountResponse>(
      "next_pms.api.dashboard.get_at_risk_projects_count",
    );
  const {
    data: membersWithoutAllocationData,
    isLoading: isMembersWithoutAllocationLoading,
  } = useFrappeGetCall<MembersWithoutAllocationResponse>(
    "next_pms.api.dashboard.get_members_without_allocation",
    {
      days: 30,
    },
  );

  const { data: nonBillableHoursData, isLoading: isNonBillableHoursLoading } =
    useFrappeGetCall<NonBillableHoursResponse>(
      "next_pms.api.dashboard.get_non_billable_hours",
      {
        days: 30,
      },
    );

  return (
    <>
      {isActiveProjectDataLoading ? (
        <StatCardSkeleton />
      ) : (
        <StatCard
          label="Active projects"
          value={activeProjectData?.message || ""}
        />
      )}
      {isAtRiskProjectDataLoading ? (
        <StatCardSkeleton />
      ) : (
        <StatCard
          label="At risk project"
          value={atRiskProjectData?.message || ""}
        />
      )}
      {isMembersWithoutAllocationLoading ? (
        <StatCardSkeleton />
      ) : (
        <StatCard
          label="Members without allocation"
          subLabel="this month"
          value={membersWithoutAllocationData?.message?.count || ""}
        />
      )}
      {isNonBillableHoursLoading ? (
        <StatCardSkeleton />
      ) : (
        <StatCard
          label="Non-billable hours logged"
          subLabel="this month"
          value={nonBillableHoursData?.message || ""}
        />
      )}
    </>
  );
}
