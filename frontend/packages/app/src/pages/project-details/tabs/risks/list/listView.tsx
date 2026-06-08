/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";

/**
 * Internal dependencies.
 */
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
  );
}
