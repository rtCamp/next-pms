/**
 * Internal dependencies.
 */
import { formatProjectDate } from "@/lib/utils";
import { PriorityBadge } from "./priorityBadge";
import { StatusBadge } from "./statusBadge";
import { UserCell } from "./userCell";
import type { GrowthInitiativeItem, GrowthListColumn } from "../../types";

interface GrowthCellProps {
  column: GrowthListColumn;
  item: GrowthInitiativeItem;
}

export function GrowthCell({ column, item }: GrowthCellProps) {
  switch (column.key) {
    case "activity":
      return (
        <span className="truncate font-medium text-ink-gray-8">
          {item.activity}
        </span>
      );
    case "category":
      return <span className="truncate">{item.category ?? "—"}</span>;
    case "client_priority":
      return <PriorityBadge priority={item.client_priority} />;
    case "status":
      return <StatusBadge status={item.status} />;
    case "activity_owner":
      return (
        <UserCell email={item.activity_owner} details={item.owner_details} />
      );
    case "project_manager":
      return (
        <UserCell email={item.project_manager} details={item.pm_details} />
      );
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
