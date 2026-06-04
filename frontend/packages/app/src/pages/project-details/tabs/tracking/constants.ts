export type ColumnDef = {
  key: string;
  label: string;
  width: string;
  align?: "left" | "right";
  srOnly?: boolean;
};

export const CONTRACT_COLUMNS: ColumnDef[] = [
  { key: "startDate", label: "Start date", width: "88px" },
  { key: "endDate", label: "End date", width: "88px" },
  { key: "hoursBought", label: "Hours bought", width: "88px", align: "right" },
  { key: "hoursUsed", label: "Hours used", width: "88px", align: "right" },
  { key: "hoursLeft", label: "Hours left", width: "88px", align: "right" },
  { key: "salesOrder", label: "Sales order", width: "104px" },
  { key: "salesInvoice", label: "Sales invoice", width: "1fr" },
  { key: "actions", label: "Actions", width: "40px", srOnly: true },
];

export const RATE_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Members", width: "1fr" },
  { key: "amount", label: "Hourly rates", width: "104px", align: "right" },
  { key: "date", label: "Valid from", width: "120px" },
  { key: "actions", label: "Actions", width: "40px", srOnly: true },
];
