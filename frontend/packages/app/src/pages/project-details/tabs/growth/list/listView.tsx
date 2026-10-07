/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";

/**
 * Internal dependencies.
 */
import { CLOSED_GROWTH_COLUMNS, OPEN_GROWTH_COLUMNS } from "../constants";
import { useGrowth } from "../context";
import { GrowthGroup } from "./listViewGroup";

export function GrowthListView() {
  const data = useGrowth((c) => c.state.data);
  const error = useGrowth((c) => c.state.error);

  if (error && data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-red-4">
        Could not load growth initiatives.
      </p>
    );
  }

  const openItems = data.filter((item) => !item.is_closed);
  const closedItems = data.filter((item) => Boolean(item.is_closed));

  return (
    <Accordion.Root multiple defaultValue={["open", "closed"]}>
      <GrowthGroup
        value="open"
        label="Open Growth Initiatives"
        columns={OPEN_GROWTH_COLUMNS}
        items={openItems}
      />
      <GrowthGroup
        value="closed"
        label="Closed Growth Initiatives"
        columns={CLOSED_GROWTH_COLUMNS}
        items={closedItems}
      />
    </Accordion.Root>
  );
}
