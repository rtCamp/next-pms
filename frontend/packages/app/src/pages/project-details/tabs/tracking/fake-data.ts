/**
 * Internal dependencies.
 */
import type { TrackingData } from "./types";

const DEFAULT_TRACKING: TrackingData = {
  company: { value: "Atlas Corporation" },
  totalProjectValue: {
    value: "$100,000",
  },
  projectProfit: {
    value: "$40,000",
  },
  projectedProfitMargin: {
    value: "43%",
  },
  lifetimeValueToDate: { value: "$250,000" },
  expectedLifetimeValue: { value: "$120,000" },
  lifetimeValueVsBilledAmount: { value: "$45,000" },
  hoursUsage: {
    hoursUtililized: 38,
    hoursTotal: 312,
  },
  taskCompletion: {
    totalIssuesCreated: 132,
    issuesOpen: 81,
    issuesClosed: 24,
  },
  invoicing: {
    invoicedPaid: 30,
    invoicedUnpaid: 40,
    totalAmount: 100,
  },
  costBurn: {
    costIncured: 30,
    costForcasted: 40,
    costTotal: 100,
  },
  contracts: [
    {
      id: "c1",
      startDate: "Oct 24, 2024",
      endDate: "Dec 24, 2024",
      hoursBought: "120 h",
      hoursUsed: "112 h",
      saleValue: "$12,000",
      saleValueUsed: "$11,200",
    },
    {
      id: "c2",
      startDate: "Jul 24, 2024",
      endDate: "Sep 24, 2024",
      hoursBought: "120 h",
      hoursUsed: "98 h",
      saleValue: "$12,000",
      saleValueUsed: "$9,800",
    },
    {
      id: "c3",
      startDate: "Apr 24, 2024",
      endDate: "Jun 24, 2024",
      hoursBought: "120 h",
      hoursUsed: "120 h",
      saleValue: "$12,000",
      saleValueUsed: "$12,000",
    },
    {
      id: "c4",
      startDate: "Jan 24, 2024",
      endDate: "Mar 24, 2024",
      hoursBought: "120 h",
      hoursUsed: "115 h",
      saleValue: "$12,000",
      saleValueUsed: "$11,500",
    },
    {
      id: "c5",
      startDate: "Oct 24, 2023",
      endDate: "Dec 24, 2023",
      hoursBought: "120 h",
      hoursUsed: "120 h",
      saleValue: "$12,000",
      saleValueUsed: "$12,000",
    },
  ],
  rates: [
    {
      id: "r1",
      name: "Julian Andrews",
      rateLabel: "Flat rate",
      amount: "$92/h",
      date: "Nov 18, 2025",
    },
    {
      id: "r2",
      name: "Kathy Phillips",
      rateLabel: "Flat rate",
      amount: "$88/h",
      date: "Nov 8, 2025",
    },
    {
      id: "r3",
      name: "Susanna Martin",
      rateLabel: "Flat rate",
      amount: "$80/h",
      date: "Oct 27, 2025",
    },
    {
      id: "r4",
      name: "Eve Patel",
      rateLabel: "Flat rate",
      amount: "$76/h",
      date: "Oct 7, 2025",
    },
    {
      id: "r5",
      name: "Divya Kumar",
      rateLabel: "Flat rate",
      amount: "$72/h",
      date: "Sep 24, 2025",
    },
  ],
};

export const TRACKING_FAKE_DATA: Record<string, TrackingData> = {};

export function getTrackingData(projectId: string): TrackingData {
  return TRACKING_FAKE_DATA[projectId] ?? DEFAULT_TRACKING;
}
