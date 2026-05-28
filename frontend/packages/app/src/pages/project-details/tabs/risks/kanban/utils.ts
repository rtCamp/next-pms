/**
 * Internal dependencies.
 */
import { RISK_STATUSES } from "../constants";
import type { RiskStatus } from "../constants";
import type { RiskItem } from "../types";
import type { RiskIdsByStatus } from "./types";

export const emptyGroups = (): RiskIdsByStatus =>
  Object.fromEntries(
    RISK_STATUSES.map((s) => [s, [] as string[]]),
  ) as RiskIdsByStatus;

export function groupIdsByStatus(risks: RiskItem[]): RiskIdsByStatus {
  const out = emptyGroups();
  for (const risk of risks) {
    if (risk.status && risk.status in out) {
      out[risk.status as RiskStatus].push(risk.name);
    } else {
      out["To-do"].push(risk.name);
    }
  }
  return out;
}
