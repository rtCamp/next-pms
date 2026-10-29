/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { KnowledgePoint } from "./knowledgePoint";
import { useProjectDetail } from "../../../context";
import { useTracking } from "../context";
import { TRACKING_HELP } from "../help";

export function LifetimeToDateCell() {
  const currency = useProjectDetail((s) => s.project?.custom_currency);
  const value = useTracking(
    (s) => s.tracking.lifetime_values?.lifetime_value_to_date,
  );

  return (
    <KnowledgePoint
      title="Lifetime value to date"
      value={value == null ? "N/A" : currencyFormat(currency).format(value)}
      help={TRACKING_HELP.lifetimeToDate}
    />
  );
}
