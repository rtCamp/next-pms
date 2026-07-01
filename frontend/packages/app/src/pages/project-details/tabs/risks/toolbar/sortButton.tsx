/**
 * External dependencies.
 */
import { SortButton as SortButtonBase } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useRisks } from "../context";

const SORT_FIELDS = [
  { field: "modified", label: "Last updated on" },
  { field: "status", label: "Status" },
  { field: "risk_category", label: "Risk category" },
  { field: "risk_level", label: "Risk level" },
];

export function SortButton() {
  const sort = useRisks((c) => c.state.sort);
  const setSort = useRisks((c) => c.actions.setSort);

  return (
    <SortButtonBase
      className="text-ink-gray-7 text-base"
      fields={SORT_FIELDS}
      sort={sort}
      onSortChange={setSort}
    />
  );
}
