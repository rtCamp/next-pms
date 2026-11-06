/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";

import { RiskGroup } from "./listViewGroup";
/**
 * Internal dependencies.
 */
import { MITIGATED_RISK_COLUMNS, OPEN_RISK_COLUMNS } from "../constants";
import { useRisks } from "../context";

export function RisksListView() {
  const data = useRisks((c) => c.state.data);

  const openRisks = data.filter((r) => !r.status || r.status !== "Mitigated");
  const mitigatedRisks = data.filter((r) => r.status === "Mitigated");

  return (
    <Accordion.Root multiple defaultValue={["open", "mitigated"]}>
      {/* Open risks group */}
      <RiskGroup
        value="open"
        label="Open Risk"
        columns={OPEN_RISK_COLUMNS}
        risks={openRisks}
      />

      {/* Mitigated risks group */}
      <RiskGroup
        value="mitigated"
        label="Mitigated Risk"
        columns={MITIGATED_RISK_COLUMNS}
        risks={mitigatedRisks}
      />
    </Accordion.Root>
  );
}
