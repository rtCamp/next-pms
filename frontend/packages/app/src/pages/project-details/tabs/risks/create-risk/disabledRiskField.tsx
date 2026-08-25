/**
 * External dependencies.
 */
import type { ReactNode } from "react";
import { FormLabel } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { DISABLED_FIELD_CLASS } from "./constants";

interface DisabledRiskFieldProps {
  label: string;
  children: ReactNode;
}

export function DisabledRiskField({ label, children }: DisabledRiskFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FormLabel size="md">{label}</FormLabel>
      <div className={DISABLED_FIELD_CLASS}>{children}</div>
    </div>
  );
}
