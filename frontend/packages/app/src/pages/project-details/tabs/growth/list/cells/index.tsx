/**
 * External dependencies.
 */
import { Avatar, Button } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { formatProjectDate } from "@/lib/utils";
import { PriorityBadge } from "./priorityBadge";
import { StatusBadge } from "./statusBadge";
import { useGrowth } from "../../context";
import type { GrowthInitiativeItem, GrowthListColumn } from "../../types";

interface GrowthCellProps {
  column: GrowthListColumn;
  item: GrowthInitiativeItem;
}

export function GrowthCell({ column, item }: GrowthCellProps) {
  const openDetail = useGrowth((c) => c.actions.openDetail);

  switch (column.key) {
    case "activity":
      return (
        <Button
          variant="ghost"
          label={item.activity}
          onClick={() => openDetail(item.name)}
          className="min-w-0 max-w-full justify-start px-0 font-medium text-ink-gray-8"
        />
      );
    case "category":
      return <span className="truncate">{item.category ?? "—"}</span>;
    case "client_priority":
      return <PriorityBadge priority={item.client_priority} />;
    case "status":
      return <StatusBadge status={item.status} />;
    case "activity_owner": {
      if (!item.activity_owner) return <span>—</span>;
      const label = item.owner_details?.full_name ?? item.activity_owner;
      return (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            size="xs"
            shape="circle"
            image={item.owner_details?.user_image ?? undefined}
            label={label}
          />
          <span className="truncate">{label}</span>
        </div>
      );
    }
    case "modified":
      return (
        <span className="truncate">
          {formatProjectDate(item.modified.slice(0, 10))}
        </span>
      );
    case "closed_status":
      return <span className="truncate">{item.closed_status ?? "—"}</span>;
    default:
      return null;
  }
}
