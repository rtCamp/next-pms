/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Filter, Select, type FilterField } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { FilterLinkValue } from "@/components/filters/FilterLinkValue";
import { RISK_STATUSES } from "../constants";
import type { RiskStatus } from "../constants";
import { useRisks } from "../context";
import { SortButton } from "./sortButton";

const USER_LINK_OPERATORS = [
  { label: "Equals", value: "=" },
  { label: "Not Equals", value: "!=" },
];

const userLinkField = (name: string, label: string): FilterField => ({
  name,
  label,
  type: "link",
  link: {
    doctype: "Employee",
    labelField: "employee_name",
    valueField: "user_id",
    customMethod: {
      method: "next_pms.timesheet.api.employee.get_employee_list",
    },
  },
  operators: USER_LINK_OPERATORS,
});

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
  const allRiskOwnersWithDetails = useRisks(
    (c) => c.state.allRiskOwnersWithDetails,
  );
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

  const riskOwnerOptions = useMemo(() => {
    return [
      { label: "All risk owners", value: "" },
      ...Object.entries(allRiskOwnersWithDetails).map(([email, details]) => ({
        label: details?.full_name ?? email,
        value: email,
      })),
    ];
  }, [allRiskOwnersWithDetails]);

  const externalFilterCount =
    (filters.owner ? 1 : 0) +
    (filters.riskOwner ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.riskLevel ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
      <div className="flex flex-wrap gap-2">
        <Select
          size="sm"
          placeholder="Risk owner"
          placeholderClassName="text-ink-gray-7"
          className="w-36 text-ink-gray-7"
          matchTriggerWidth
          value={filters.riskOwner}
          onChange={(v) => setFilters({ riskOwner: (v ?? "") as string })}
          options={riskOwnerOptions}
        />
        <Select
          size="sm"
          placeholder="Owner"
          placeholderClassName="text-ink-gray-7"
          className="w-36 text-ink-gray-7"
          matchTriggerWidth
          value={filters.owner}
          onChange={(v) => setFilters({ owner: (v ?? "") as string })}
          options={ownerOptions}
        />
        <Select
          size="sm"
          placeholder="Status"
          placeholderClassName="text-ink-gray-7"
          className="w-30 text-ink-gray-7"
          matchTriggerWidth
          value={filters.status}
          onChange={(v) => setFilters({ status: (v ?? "") as RiskStatus | "" })}
          options={STATUS_OPTIONS}
        />
        <Select
          size="sm"
          placeholder="Risk level"
          placeholderClassName="text-ink-gray-7"
          className="w-30 text-ink-gray-7"
          matchTriggerWidth
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
          renderLinkValue={(props) => <FilterLinkValue {...props} />}
          fields={[
            { name: "risk_category", label: "Risk category", type: "string" },
            { name: "summary", label: "Summary", type: "string" },
            userLinkField("risk_owner", "Risk owner"),
            userLinkField("owner", "Owner"),
          ]}
          externalFilterCount={externalFilterCount}
          onClearAll={() =>
            setFilters({
              owner: "",
              riskOwner: "",
              status: "",
              riskLevel: "",
            })
          }
        />
        <SortButton />
      </div>
    </div>
  );
}
