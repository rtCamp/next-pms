/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Filter, Select } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { RISK_STATUSES } from "../constants";
import type { RiskStatus } from "../constants";
import { useRisks } from "../context";
import { SortButton } from "./sortButton";

const RISK_LEVEL_OPTIONS = [
  { label: "All", value: "" },
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  ...RISK_STATUSES.map((s) => ({ label: s, value: s })),
];

export function RisksToolbar() {
  const filters = useRisks((c) => c.state.filters);
  const allOwnersWithDetails = useRisks((c) => c.state.allOwnersWithDetails);
  const setFilters = useRisks((c) => c.actions.setFilters);

  const ownerOptions = useMemo(() => {
    return [
      { label: "All owners", value: "" },
      ...Object.entries(allOwnersWithDetails).map(([email, details]) => ({
        label: details?.full_name ?? email,
        value: email,
      })),
    ];
  }, [allOwnersWithDetails]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
      <div className="flex flex-wrap gap-2">
        <Select
          size="sm"
          placeholder="Owner"
          placeholderClassName="text-ink-gray-7"
          className="w-fit text-ink-gray-7"
          value={filters.owner}
          onChange={(v) => setFilters({ owner: (v ?? "") as string })}
          options={ownerOptions}
        />
        <Select
          size="sm"
          placeholder="Status"
          placeholderClassName="text-ink-gray-7"
          className="w-fit text-ink-gray-7"
          value={filters.status}
          onChange={(v) => setFilters({ status: (v ?? "") as RiskStatus | "" })}
          options={STATUS_OPTIONS}
        />
        <Select
          size="sm"
          placeholder="Risk level"
          placeholderClassName="text-ink-gray-7"
          className="w-fit text-ink-gray-7"
          value={filters.riskLevel}
          onChange={(v) => setFilters({ riskLevel: (v ?? "") as string })}
          options={RISK_LEVEL_OPTIONS}
        />
      </div>

      <div className="flex gap-2">
        <Filter
          align="end"
          value={filters.advanced}
          onChange={(v) => setFilters({ advanced: v })}
          fields={[
            { name: "risk_category", label: "Risk category", type: "string" },
            { name: "summary", label: "Summary", type: "string" },
            { name: "owner", label: "Owner", type: "string" },
          ]}
        />
        <SortButton />
      </div>
    </div>
  );
}
