/**
 * External dependencies.
 */
import { SortSelector } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { GROWTH_SORT_FIELDS } from "../constants";
import { useGrowth } from "../context";

export function SortButton() {
  const sort = useGrowth((c) => c.state.sort);
  const setSort = useGrowth((c) => c.actions.setSort);

  return (
    <SortSelector
      className="text-ink-gray-7 text-base"
      fields={GROWTH_SORT_FIELDS}
      sort={sort}
      onSortChange={setSort}
    />
  );
}
