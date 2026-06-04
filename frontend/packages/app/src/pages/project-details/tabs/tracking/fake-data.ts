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
      startDate: "Oct 15, 2025",
      endDate: "Mar 31",
      hoursBought: "500h",
      hoursUsed: "472h",
      hoursLeft: "28h",
      salesOrder: "AT-SO-21",
      salesInvoice: "AT-INV-21",
    },
    {
      id: "c2",
      startDate: "Nov 1, 2025",
      endDate: "Dec 31, 2025",
      hoursBought: "300h",
      hoursUsed: "165h",
      hoursLeft: "135h",
      salesOrder: "AT-SO-22",
      salesInvoice: "AT-INV-22",
    },
    {
      id: "c3",
      startDate: "Dec 10, 2025",
      endDate: "Feb 28",
      hoursBought: "120h",
      hoursUsed: "118h",
      hoursLeft: "2h",
      salesOrder: "AT-SO-23",
      salesInvoice: "AT-INV-23",
    },
    {
      id: "c4",
      startDate: "Jan 5, 2026",
      endDate: "Jun 30",
      hoursBought: "600h",
      hoursUsed: "210h",
      hoursLeft: "390h",
      salesOrder: "AT-SO-24",
      salesInvoice: "AT-INV-24",
    },
    {
      id: "c5",
      startDate: "Sep 1, 2025",
      endDate: "Dec 31, 2025",
      hoursBought: "200h",
      hoursUsed: "200h",
      hoursLeft: "0h",
      salesOrder: "AT-SO-25",
      salesInvoice: "AT-INV-25",
    },
  ],
  flatRate: { amount: "$120/h", date: "Nov 18, 2025" },
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
