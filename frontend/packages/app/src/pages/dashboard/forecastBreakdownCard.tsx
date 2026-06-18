/**
 * External dependencies.
 */
import { useState } from "react";
import { Select } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { ALL_ROLES_VALUE, FORECAST_BY_ROLE, ROLE_OPTIONS } from "./constants";

export type ForecastData = {
  allocated: number;
  tentative: number;
  unallocated: number;
};

export function ForecastBreakdownCard() {
  const [role, setRole] = useState<string>(ALL_ROLES_VALUE);
  const data = FORECAST_BY_ROLE[role] ?? FORECAST_BY_ROLE[ALL_ROLES_VALUE];

  const segments = [
    {
      key: "allocated",
      label: "Allocated hours",
      value: data.allocated,
      colorClass: "bg-surface-green-5",
    },
    {
      key: "tentative",
      label: "Tentatively allocated hours",
      value: data.tentative,
      colorClass: "bg-surface-green-4",
    },
    {
      key: "unallocated",
      label: "Unallocated hours",
      value: data.unallocated,
      colorClass: "bg-surface-gray-3",
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Forecast breakdown
        </h3>
        <Select
          className="w-fit shrink-0 bg-surface-gray-2 font-bold text-ink-gray-7"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(value) => setRole(value ?? ALL_ROLES_VALUE)}
        />
      </div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={`${segment.colorClass} h-full`}
            style={{ width: `${segment.value}%` }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${segment.colorClass}`}
              />
              <span className="truncate text-base text-ink-gray-6">
                {segment.label}
              </span>
            </div>
            <span className="text-base font-medium text-ink-gray-7">
              {segment.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
