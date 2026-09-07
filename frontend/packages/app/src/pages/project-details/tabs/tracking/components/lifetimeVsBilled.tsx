/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { KnowledgePoint } from "./knowledgePoint";
import { useProjectDetail } from "../../../context";
import { useTracking } from "../context";

export function LifetimeVsBilledCell() {
  const currency = useProjectDetail((s) => s.project?.custom_currency);
  const value = useTracking(
    (s) => s.tracking.lifetime_values?.lifetime_value_vs_billed_amount,
  );

  return (
    <KnowledgePoint
      title="Lifetime value vs billed amount"
      value={currencyFormat(currency).format(value ?? 0)}
    />
  );
}
