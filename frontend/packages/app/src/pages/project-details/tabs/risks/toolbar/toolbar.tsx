/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Select } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { RISK_STATUSES, RISK_VIEW_PARAM } from "../constants";
import type { RiskStatus } from "../constants";
import { useRisks } from "../context";
import { ColumnsDropdown } from "./columnsDropdown";
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
  const [searchParams] = useSearchParams();
  const isKanban = searchParams.get(RISK_VIEW_PARAM) === "kanban";

  const filters = useRisks((c) => c.state.filters);
  const allOwnersWithDetails = useRisks((c) => c.state.allOwnersWithDetails);
  const visibleColumns = useRisks((c) => c.state.visibleColumns);
  const setFilters = useRisks((c) => c.actions.setFilters);
  const setVisibleColumns = useRisks((c) => c.actions.setVisibleColumns);

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
      {/* Left: quick filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          size="sm"
          placeholder="Owner"
          className="w-fit"
          value={filters.owner}
          onChange={(v) => setFilters({ owner: (v ?? "") as string })}
          options={ownerOptions}
        />
        <Select
          size="sm"
          placeholder="Status"
          className="w-fit"
          value={filters.status}
          onChange={(v) => setFilters({ status: (v ?? "") as RiskStatus | "" })}
          options={STATUS_OPTIONS}
        />
        <Select
          size="sm"
          placeholder="Risk level"
          className="w-fit"
          value={filters.riskLevel}
          onChange={(v) => setFilters({ riskLevel: (v ?? "") as string })}
          options={RISK_LEVEL_OPTIONS}
        />
      </div>

      {/* Right: columns, filter, sort */}
      <div className="flex gap-2">
        {isKanban && (
          <ColumnsDropdown
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
          />
        )}
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
