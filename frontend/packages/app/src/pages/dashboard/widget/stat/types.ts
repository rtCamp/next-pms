/**
 * Internal dependencies.
 */
import type { MembersWithoutAllocationResponse } from "../../leadership-view/provider/type";

export type StatMessage = number | MembersWithoutAllocationResponse["message"];

export interface StatCardConfig {
  endpoint: string;
  label: string;
  subLabel?: string;
  params?: Record<string, number>;
  format: (message: StatMessage) => string;
}
