/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { RiskStatus } from "../constants";
import { RiskStatusBadge } from "../riskStatusBadge";

interface KanbanColumnHeaderProps {
  status: RiskStatus;
  onAdd: () => void;
}

export function KanbanColumnHeader({ status, onAdd }: KanbanColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1.5">
      <RiskStatusBadge status={status} className="text-base text-ink-gray-7" />

      <Button
        variant="ghost"
        type="button"
        onClick={onAdd}
        icon={() => <Plus />}
      />
    </div>
  );
}
