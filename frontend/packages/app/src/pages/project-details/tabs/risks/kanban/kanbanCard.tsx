/**
 * External dependencies.
 */
import { Fire } from "@rtcamp/frappe-ui-react/icons";
import { Tag, User, AlignLeft } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { RiskItem } from "../types";
import { stripHtml } from "../utils";

interface RiskCardProps {
  risk: RiskItem;
}

export function RiskCard({ risk }: RiskCardProps) {
  return (
    <div className="flex w-full cursor-grab active:cursor-grabbing flex-col gap-2.5 rounded-xl border border-outline-gray-1 bg-surface-white shadow-sm hover:bg-surface-gray-1">
      {/* Risk level header */}
      <div className="px-3.5 py-3 flex items-center gap-2 text-ink-gray-8 text-base border-b border-outline-gray-1">
        <Fire className="size-4 shrink-0" />
        <span className="font-medium">
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
            <User className="size-4 shrink-0" />
            <span className="truncate">{risk.owner}</span>
          </div>
        )}

        {/* Summary */}
        {risk.summary && (
          <div className="flex items-start gap-2">
            <AlignLeft className="size-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{stripHtml(risk.summary)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
