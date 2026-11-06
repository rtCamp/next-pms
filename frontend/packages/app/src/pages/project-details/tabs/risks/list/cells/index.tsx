/**
 * External dependencies.
 */
import { stripTags } from "@next-pms/design-system/utils";
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { formatProjectDate } from "@/lib/utils";
import { RiskStatusBadge } from "../../riskStatusBadge";
import type { RiskItem, RiskListColumn } from "../../types";

interface RiskCellProps {
  column: RiskListColumn;
  risk: RiskItem;
}

export function RiskCell({ column, risk }: RiskCellProps) {
  switch (column.key) {
    case "risk_category":
      return (
        <span className="truncate font-medium text-ink-gray-8">
          {risk.risk_category ?? "—"}
        </span>
      );
    case "summary":
      return <span className="truncate">{stripTags(risk.summary || "—")}</span>;
    case "risk_owner": {
      if (!risk.risk_owner) return <span>—</span>;
      const name = risk.risk_owner_details?.full_name ?? risk.risk_owner;
      return (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            size="xs"
            shape="circle"
            image={risk.risk_owner_details?.user_image ?? undefined}
            label={name}
          />
          <span className="truncate">{name}</span>
        </div>
      );
    }
    case "risk_level":
      return <span className="truncate">{risk.risk_level ?? "—"}</span>;
    case "status":
      return <RiskStatusBadge status={risk.status} />;
    case "creation":
      return (
        <span className="truncate">
          {formatProjectDate(risk.creation.slice(0, 10))}
        </span>
      );
    case "mitigated_on":
      return (
        <span className="truncate">
          {risk.mitigated_on
            ? formatProjectDate(risk.mitigated_on.slice(0, 10))
            : "—"}
        </span>
      );
    default:
      return null;
  }
}
