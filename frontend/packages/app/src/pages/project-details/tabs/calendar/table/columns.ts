export type TableColumn = {
  key: string;
  label: string;
  width?: string;
};

export const MILESTONE_COLUMNS: TableColumn[] = [
  { key: "title", label: "Title" },
  { key: "startDate", label: "Start date", width: "w-28" },
  { key: "plannedEndDate", label: "Planned end", width: "w-28" },
  { key: "actualEndDate", label: "Actual end", width: "w-28" },
  { key: "owner", label: "Owners", width: "w-28" },
  { key: "watchers", label: "Watchers", width: "w-28" },
  { key: "actions", label: "", width: "w-12" },
];

export const TOUCHPOINT_COLUMNS: TableColumn[] = [
  { key: "title", label: "Title" },
  { key: "plannedEndDate", label: "Planned date", width: "w-28" },
  { key: "actualEndDate", label: "Actual date", width: "w-28" },
  { key: "owner", label: "Owners", width: "w-28" },
  { key: "watchers", label: "Watchers", width: "w-28" },
  { key: "actions", label: "", width: "w-12" },
];
