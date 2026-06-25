/**
 * External dependencies.
 */
import { Badge } from "@rtcamp/frappe-ui-react";

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status !== "Sent") {
    return null;
  }

  return (
    <Badge
      variant="solid"
      size="sm"
      className="bg-surface-green-2 text-ink-green-3"
    >
      Sent
    </Badge>
  );
}
