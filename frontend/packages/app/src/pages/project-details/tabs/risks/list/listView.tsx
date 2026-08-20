/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";

/**
 * Internal dependencies.
 */
import { useRisks } from "../context";
import { RiskGroup } from "./listViewGroup";

export function RisksListView() {
  const data = useRisks((c) => c.state.data);

  const openRisks = data.filter((r) => !r.status || r.status !== "Mitigated");
  const mitigatedRisks = data.filter((r) => r.status === "Mitigated");

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
