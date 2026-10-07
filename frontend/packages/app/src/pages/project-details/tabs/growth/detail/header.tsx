/**
 * External dependencies.
 */
import { useSearchParams } from "react-router";
import { Button } from "@rtcamp/frappe-ui-react";
import { ArrowLeft } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { FollowersBadge } from "@/pages/project-details/components/followersBadge";
import type { Follower } from "@/pages/project-details/types";
import { useUser } from "@/providers/user";
import { GROWTH_DETAIL_PARAM } from "../constants";
import { OwnerPill } from "./ownerPill";
import { PriorityBadge } from "../list/cells/priorityBadge";
import { StatusBadge } from "../list/cells/statusBadge";
import { GrowthRowActions } from "../rowActions";
import type { GrowthDetail } from "../types";

interface GrowthDetailHeaderProps {
  growth: GrowthDetail;
  followers: Follower[];
  onAfterFollow: () => void;
}

export function GrowthDetailHeader({
  growth,
  followers,
  onAfterFollow,
}: GrowthDetailHeaderProps) {
  const [, setSearchParams] = useSearchParams();
  const userId = useUser(({ state }) => state.userId);
  const isFollowing = followers.some((f) => f.user === userId);

  const handleBack = () => {
    setSearchParams((prev) => {
      prev.delete(GROWTH_DETAIL_PARAM);
      return prev;
    });
  };

  return (
    <div className="flex justify-between items-center flex-wrap mb-3.5">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          type="button"
          onClick={handleBack}
          className="p-0 hover:bg-transparent focus-visible:bg-transparent"
          icon={ArrowLeft}
          aria-label="Back to growth initiatives"
        />
        <h2 className="text-xl font-semibold text-ink-gray-7 truncate max-w-125">
          {growth.activity}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-sm text-ink-gray-7">
        {growth.client_priority && (
          <PriorityBadge priority={growth.client_priority} />
        )}
        <OwnerPill
          email={growth.activity_owner}
          details={growth.activity_owner_details}
          role="Activity owner"
        />
        <OwnerPill
          email={growth.ideation_owner}
          details={growth.ideation_owner_details}
          role="Ideation owner"
        />
        <div className="bg-surface-gray-2 rounded-full px-2 py-1">
          <StatusBadge status={growth.status} />
        </div>
        {growth.closed_status && (
          <div className="bg-surface-gray-2 rounded-full px-2 py-1">
            {growth.closed_status}
          </div>
        )}
        <FollowersBadge followers={followers} />
        <GrowthRowActions
          growthName={growth.name}
          activityOwner={growth.activity_owner}
          isFollowing={isFollowing}
          onAfterFollow={onAfterFollow}
        />
      </div>
    </div>
  );
}
