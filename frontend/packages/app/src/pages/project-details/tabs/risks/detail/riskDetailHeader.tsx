/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { Avatar } from "@rtcamp/frappe-ui-react";
import { Button } from "@rtcamp/frappe-ui-react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";

/**
 * Internal dependencies.
 */
import { RISK_DETAIL_PARAM } from "../constants";
import { FollowersBadge } from "./followersBadge";
import { RiskLevelBadge } from "./riskLevelBadge";
import { RiskStatusBadge } from "../riskStatusBadge";
import type { RiskDetail, Follower } from "../types";

interface RiskDetailHeaderProps {
  risk: RiskDetail;
  followers?: Follower[];
}

export function RiskDetailHeader({
  risk,
  followers = [],
}: RiskDetailHeaderProps) {
  const [, setSearchParams] = useSearchParams();

  const handleBack = () => {
    setSearchParams((prev) => {
      prev.delete(RISK_DETAIL_PARAM);
      return prev;
    });
  };

  const displayTitle = risk.risk_category
    ? `${risk.risk_category} Risk`
    : risk.name;

  return (
    <div className="flex justify-between items-center flex-wrap mb-3.5">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          type="button"
          onClick={handleBack}
          className="p-0 hover:bg-transparent focus-visible:bg-transparent"
          icon={() => <ArrowLeft />}
        />

        <h2 className="text-xl font-semibold text-ink-gray-8 truncate max-w-125">
          {displayTitle}
        </h2>
      </div>

      <div className="flex items-center gap-1 text-sm text-ink-gray-7">
        <RiskLevelBadge level={risk.risk_level} />

        {risk.owner && (
          <div className="flex items-center gap-1 bg-surface-gray-2 rounded-full px-2 py-1">
            <Avatar
              size="xs"
              shape="circle"
              image={risk.owner_details?.user_image ?? undefined}
              label={risk.owner_details?.full_name ?? risk.owner}
            />
            <span>{risk.owner_details?.full_name ?? risk.owner}</span>
          </div>
        )}

        <RiskStatusBadge
          status={risk.status}
          className="bg-surface-gray-2 rounded-full px-2 py-1"
        />

        <FollowersBadge followers={followers} />

        <Button
          variant="ghost"
          type="button"
          onClick={() => {}}
          icon={() => <MoreHorizontal />}
        />
      </div>
    </div>
  );
}
