/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";
import { Fire } from "@rtcamp/frappe-ui-react/icons";
import { Tag, AlignLeft } from "lucide-react";

/**
 * Internal dependencies.
 */
import { stripTags } from "@/lib/utils";
import type { RiskItem } from "../types";

interface RiskCardProps {
  risk: RiskItem;
}

export function RiskCard({ risk }: RiskCardProps) {
  return (
    <div className="flex w-full cursor-grab active:cursor-grabbing flex-col gap-2.5 rounded-xl border border-outline-gray-1 bg-surface-white shadow-sm hover:bg-surface-gray-1">
      {/* Risk level header */}
      <div className="px-3.5 py-3 flex items-center gap-2 text-ink-gray-8 text-base border-b border-outline-gray-1">
        <Fire className="size-4 shrink-0" />
        <span className="font-medium underline underline-offset-2">
          {risk.risk_level ? `${risk.risk_level} risk` : "Unknown risk level"}
        </span>
      </div>

      {/* Card Body */}
      <div className="text-ink-gray-6 text-base px-4 pt-2.5 pb-3">
        {/* Category */}
        {risk.risk_category && (
          <div className="flex items-center gap-2 mb-3.5">
            <Tag className="size-4 shrink-0" />
            <span className="truncate">{risk.risk_category}</span>
          </div>
        )}

        {/* Owner */}
        {risk.owner && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar
              size="xs"
              shape="circle"
              image={risk.owner_details?.user_image ?? undefined}
              label={risk.owner_details?.full_name ?? risk.owner}
            />
            <span className="truncate">
              {risk.owner_details?.full_name ?? risk.owner}
            </span>
          </div>
        )}

        {/* Summary */}
        {risk.summary && (
          <div className="flex items-start gap-2">
            <AlignLeft className="size-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{stripTags(risk.summary)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
