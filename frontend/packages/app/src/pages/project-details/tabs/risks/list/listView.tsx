/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";

/**
 * Internal dependencies.
 */
import { RISK_LIST_COLUMNS } from "../constants";
import { useRisks } from "../context";
import { RiskGroup } from "./listViewGroup";
import { RiskItem } from "../types";

export function RisksListView() {
  const data = useRisks((c) => c.state.data);
  const [localData, setLocalData] = useState<RiskItem[]>(data);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setLocalData(data);
  }, [data]);

  const openRisks = localData.filter(
    (r) => !r.status || r.status !== "Mitigated",
  );
  const mitigatedRisks = localData.filter((r) => r.status === "Mitigated");

  return (
    <div className="flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 py-0.5 border-b border-outline-gray-1 text-sm text-ink-gray-5 mb-2">
        {RISK_LIST_COLUMNS.map((col) => (
          <div
            key={col.key}
            style={{ minWidth: col.width, flex: col.flex }}
            className="truncate px-2 py-1.5"
          >
            {col.label}
          </div>
        ))}
        {/* spacer for actions column */}
        <div className="w-8 shrink-0" />
      </div>

      <Accordion.Root multiple defaultValue={["open", "mitigated"]}>
        {/* Open risks group */}
        <RiskGroup value="open" label="Open Risk" risks={openRisks} />

        {/* Mitigated risks group */}
        <RiskGroup
          value="mitigated"
          label="Mitigated Risk"
          risks={mitigatedRisks}
        />
      </Accordion.Root>
    </div>
  );
}
