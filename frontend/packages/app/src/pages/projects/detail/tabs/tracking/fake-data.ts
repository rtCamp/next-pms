/**
 * Internal dependencies.
 */
import type { TrackingData } from "./types";

const DEFAULT_TRACKING: TrackingData = {
  company: "Atlas Corporation",
  totalProjectValue: "$100,000",
  projectProfit: "$40,000",
  projectedProfitMargin: "43%",
  lifetimeValueToDate: "$250,000",
  expectedLifetimeValue: "$120,000",
  lifetimeValueVsBilledAmount: "$45,000",
  hoursUsage: {
    utilised: 250,
    total: 385,
  },
  taskCompletion: {
    totalIssues: 200,
    openIssues: 96,
    completedIssues: 104,
  },
  costBurn: {
    actual: 29000,
    forecasted: 19000,
    total: 60000,
  },
  invoiceBurn: {
    paid: 35000,
    unpaid: 12000,
    total: 100000,
  },
};

export const TRACKING_FAKE_DATA: Record<string, TrackingData> = {};

export function getTrackingData(projectId: string): TrackingData {
  return TRACKING_FAKE_DATA[projectId] ?? DEFAULT_TRACKING;
}
