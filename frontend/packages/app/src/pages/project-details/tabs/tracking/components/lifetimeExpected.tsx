/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { KnowledgePoint } from "./knowledgePoint";
import { useProjectDetail } from "../../../context";
import { useTracking } from "../context";

export function LifetimeExpectedCell() {
  const currency = useProjectDetail((s) => s.project?.custom_currency);
  const value = useTracking(
    (s) => s.tracking.lifetime_values?.expected_lifetime_value,
  );

  return (
    <KnowledgePoint
      title="Expected lifetime value"
      value={currencyFormat(currency).format(value ?? 0)}
    />
  );
}
