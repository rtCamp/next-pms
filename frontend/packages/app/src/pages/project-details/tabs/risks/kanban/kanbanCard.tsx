/**
 * External dependencies.
 */
import { useRef } from "react";
import { Avatar } from "@rtcamp/frappe-ui-react";
import { Fire } from "@rtcamp/frappe-ui-react/icons";
import { Tag, AlignLeft } from "lucide-react";

/**
 * Internal dependencies.
 */
import { stripTags } from "@/lib/utils";
import { useRisks } from "../context";
import type { RiskItem } from "../types";
import { CLICK_DRAG_THRESHOLD_PX } from "./constants";

interface RiskCardProps {
  risk: RiskItem;
}

export function RiskCard({ risk }: RiskCardProps) {
  const openRiskDetail = useRisks((c) => c.actions.openRiskDetail);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const handleActivate = () => openRiskDetail(risk.name);

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.hypot(dx, dy) <= CLICK_DRAG_THRESHOLD_PX) {
          handleActivate();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
      className="flex w-full cursor-pointer flex-col gap-2.5 rounded-xl border border-outline-gray-1 bg-surface-white shadow-sm hover:bg-surface-gray-1 focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3"
    >
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
