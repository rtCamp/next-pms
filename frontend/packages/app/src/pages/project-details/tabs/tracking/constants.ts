export type ColumnDef = {
  key: string;
  label: string;
  width: string;
  align?: "left" | "right";
  srOnly?: boolean;
};

export const CONTRACT_COLUMNS: ColumnDef[] = [
  { key: "startDate", label: "Start date", width: "1fr" },
  { key: "endDate", label: "End date", width: "1fr" },
  { key: "hoursBought", label: "Hours bought", width: "1fr", align: "right" },
  { key: "hoursUsed", label: "Hours used", width: "1fr", align: "right" },
  { key: "saleValue", label: "Sale value", width: "1fr", align: "right" },
  {
    key: "saleValueUsed",
    label: "Sale value used",
    width: "1fr",
    align: "right",
  },
  { key: "actions", label: "Actions", width: "40px", srOnly: true },
];

export const RATE_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name", width: "2fr" },
  { key: "rate", label: "Rate", width: "1fr" },
  { key: "amount", label: "Amount", width: "1fr", align: "right" },
  { key: "date", label: "Date", width: "1fr", align: "right" },
  { key: "actions", label: "Actions", width: "40px", srOnly: true },
];
