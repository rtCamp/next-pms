/**
 * External dependencies.
 */
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { StatusBadge } from "@/pages/project-details/tabs/growth/list/cells/statusBadge";
import { usePipeline } from "../context";

interface ColumnHeaderProps {
  status: string;
  count: number;
  total: number;
  onAdd?: () => void;
}

export function ColumnHeader({
  status,
  count,
  total,
  onAdd,
}: ColumnHeaderProps) {
  const currency = usePipeline((c) => c.state.currency);

  return (
    <div className="flex flex-col gap-0.5 px-1.5">
      <div className="flex h-7 items-center gap-2">
        <div className="min-w-0 text-base font-medium text-ink-gray-8">
          <StatusBadge status={status} />
        </div>
        <span className="text-sm text-ink-gray-5">{count}</span>
        <span className="flex-1" />
        {onAdd && (
          <Tooltip text={`Add to ${status}`}>
            <Button
              variant="ghost"
              size="sm"
              icon={AddSm}
              className="shrink-0"
              aria-label={`Add growth initiative to ${status}`}
              onClick={onAdd}
            />
          </Tooltip>
        )}
      </div>
      <span className="text-sm tabular-nums text-ink-gray-5">
        {currencyFormat(currency).format(total)}
      </span>
    </div>
  );
}
