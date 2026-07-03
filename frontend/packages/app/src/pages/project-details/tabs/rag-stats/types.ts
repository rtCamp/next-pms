export type ColumnDef<K extends string = string> = {
  key: K;
  label: string;
  width: string;
  align?: "left" | "right";
};

export type TriggerRow = {
  id: string;
  type: string;
  alert: string;
  triggerDate: string;
};

export type HistoryRow = TriggerRow & {
  clearDate: string;
};
