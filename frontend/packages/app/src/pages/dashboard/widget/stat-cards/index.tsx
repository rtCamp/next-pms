/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { StatCardSkeleton } from "./skeleton";
import { StatCard } from "./statCard";
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
    { days: 30 },
  );

  const { data: nonBillableHoursData, isLoading: isNonBillableHoursLoading } =
    useFrappeGetCall<NonBillableHoursResponse>(
      "next_pms.api.dashboard.get_non_billable_hours",
      { days: 30 },
    );

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex gap-3">
        {isActiveProjectDataLoading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            className="flex-1"
            label="Active projects"
            value={activeProjectData?.message ?? "-"}
            to={ROUTES.project + "?status=Open"}
          />
        )}
        {isAtRiskProjectDataLoading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            className="flex-1"
            label="At risk project"
            value={atRiskProjectData?.message ?? "-"}
            to={ROUTES.project + "?rag=red"}
          />
        )}
        {isMembersWithoutAllocationLoading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            className="flex-1"
            label="Members without allocation"
            subLabel="this month"
            value={membersWithoutAllocationData?.message?.count ?? "-"}
          />
        )}
        {isNonBillableHoursLoading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            className="flex-1"
            label="Non-billable hours logged"
            subLabel="this month"
            value={nonBillableHoursData?.message ?? "-"}
          />
        )}
      </div>
    </div>
  );
}
