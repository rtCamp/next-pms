/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Button, Select } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { DEFAULT_GROWTH_FILTERS } from "../constants";
import { useGrowth } from "../context";
import { OwnerCombobox } from "./ownerCombobox";
import { SortButton } from "./sortButton";

const toNameOptions = (allLabel: string, docs: { name: string }[]) => [
  { label: allLabel, value: "" },
  ...docs.map((doc) => ({ label: doc.name, value: doc.name })),
];

export function GrowthToolbar() {
  const filters = useGrowth((c) => c.state.filters);
  const activityOwners = useGrowth((c) => c.state.activityOwnersWithDetails);
  const ideationOwners = useGrowth((c) => c.state.ideationOwnersWithDetails);
  const setFilters = useGrowth((c) => c.actions.setFilters);

  const statuses = useGrowth((c) => c.state.statuses);
  const categories = useGrowth((c) => c.state.categories);

  const statusOptions = useMemo(
    () => toNameOptions("All statuses", statuses),
    [statuses],
  );
  const categoryOptions = useMemo(
    () => toNameOptions("All categories", categories),
    [categories],
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
      <div className="flex flex-wrap gap-2">
        <OwnerCombobox
          placeholder="Activity owner"
          owners={activityOwners}
          value={filters.activityOwner}
          onChange={(activityOwner) => setFilters({ activityOwner })}
        />
        <OwnerCombobox
          placeholder="Ideation owner"
          owners={ideationOwners}
          value={filters.ideationOwner}
          onChange={(ideationOwner) => setFilters({ ideationOwner })}
        />
        <Select
          size="sm"
          placeholder="Status"
          placeholderClassName="text-ink-gray-7"
          className="w-32 text-ink-gray-7"
          matchTriggerWidth
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value as string })}
          options={statusOptions}
        />
        <Select
          size="sm"
          placeholder="Category"
          placeholderClassName="text-ink-gray-7"
          className="w-36 text-ink-gray-7"
          matchTriggerWidth
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value as string })}
          options={categoryOptions}
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            label="Clear"
            onClick={() => setFilters(DEFAULT_GROWTH_FILTERS)}
          />
        )}
      </div>

      <SortButton />
    </div>
  );
}
