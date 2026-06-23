/**
 * External dependencies.
 */
import { useMemo } from "react";
import { MultiSelect } from "@rtcamp/frappe-ui-react";
import type { MultiSelectOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { RISK_STATUSES } from "../constants";
import type { RiskStatus } from "../constants";
import { RiskStatusBadge } from "../riskStatusBadge";
import type { RiskVisibleColumns } from "../types";

interface ColumnsDropdownProps {
  visibleColumns: RiskVisibleColumns;
  setVisibleColumns: (partial: Partial<RiskVisibleColumns>) => void;
}

const COLUMN_OPTIONS: MultiSelectOption[] = RISK_STATUSES.map((status) => ({
  value: status,
  label: status,
}));

export function ColumnsDropdown({
  visibleColumns,
  setVisibleColumns,
}: ColumnsDropdownProps) {
  const selectedValues = useMemo(
    () =>
      RISK_STATUSES.filter((status) => visibleColumns[status]).map(
        (status) => status,
      ),
    [visibleColumns],
  );

  const handleChange = (newValues: string[]) => {
    const partial = Object.fromEntries(
      RISK_STATUSES.map((status) => [status, newValues.includes(status)]),
    ) as unknown as RiskVisibleColumns;
    setVisibleColumns(partial);
  };

  return (
    <div>
      <MultiSelect
        options={COLUMN_OPTIONS}
        value={selectedValues}
        triggerLabel="Columns"
        triggerClassName="text-ink-gray-7"
        hideSearch
        onChange={handleChange}
        renderOption={(option) => (
          <RiskStatusBadge status={option.value as RiskStatus} />
        )}
        popupClassName="w-full"
      />
    </div>
  );
}
