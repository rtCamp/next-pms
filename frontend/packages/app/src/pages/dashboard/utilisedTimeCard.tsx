/**
 * External dependencies.
 */
import { useState } from "react";
import { Select } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import {
  ALL_ROLES_VALUE,
  ROLE_OPTIONS,
  UTILISATION_BY_ROLE,
} from "./constants";
import { UtilisationDonut } from "./utilisationDonut";

export type UtilisationData = {
  billable: number;
  nonBillable: number;
};

export function UtilisedTimeCard() {
  const [role, setRole] = useState<string>(ALL_ROLES_VALUE);
  const data =
    UTILISATION_BY_ROLE[role] ?? UTILISATION_BY_ROLE[ALL_ROLES_VALUE];

  const legend = [
    {
      label: "Billable hours",
      value: data.billable,
      dotClass: "bg-surface-blue-5",
    },
    {
      label: "Non-billable hours",
      value: data.nonBillable,
      dotClass: "bg-surface-blue-4",
    },
  ];

  return (
    <div className="flex max-w-md flex-col gap-4 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Utilised time in the past 30 days
        </h3>
        <Select
          className="w-fit shrink-0 bg-surface-gray-2 font-bold text-ink-gray-7"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(value) => setRole(value ?? ALL_ROLES_VALUE)}
        />
      </div>
      <div className="flex items-center gap-8">
        <UtilisationDonut
          segments={[
            { value: data.billable, colorClass: "text-surface-blue-5" },
            { value: data.nonBillable, colorClass: "text-surface-blue-4" },
          ]}
        />
        <div className="flex grow flex-col gap-3">
          {legend.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`size-2 shrink-0 rounded-full ${item.dotClass}`}
                />
                <span className="truncate text-base text-ink-gray-6">
                  {item.label}
                </span>
              </div>
              <span className="text-base font-medium text-ink-gray-6">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
