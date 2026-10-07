/**
 * External dependencies.
 */
import type { ReactNode } from "react";
import { FormLabel } from "@rtcamp/frappe-ui-react";

interface DisabledFieldProps {
  label: string;
  children: ReactNode;
}

export function DisabledField({ label, children }: DisabledFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FormLabel size="md">{label}</FormLabel>
      <div className="flex h-8 items-center gap-1 rounded border border-outline-gray-2 bg-surface-gray-1 px-2.5 text-ink-gray-5">
        {children}
      </div>
    </div>
  );
}
