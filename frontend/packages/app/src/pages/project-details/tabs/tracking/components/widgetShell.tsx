/**
 * External dependencies.
 */
import type { PropsWithChildren } from "react";
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";
import { Close } from "@rtcamp/frappe-ui-react/icons";

type WidgetShellProps = PropsWithChildren<{
  label: string;
  onRemove: () => void;
}>;

export function WidgetShell({ label, onRemove, children }: WidgetShellProps) {
  return (
    <div className="relative flex min-w-0 flex-col">
      {children}
      <Tooltip text={`Remove ${label}`}>
        <Button
          className="absolute right-2 top-2 z-10"
          variant="subtle"
          theme="gray"
          icon={Close}
          aria-label={`Remove ${label}`}
          onClick={onRemove}
        />
      </Tooltip>
    </div>
  );
}
