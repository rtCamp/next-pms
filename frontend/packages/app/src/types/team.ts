/**
 * Internal dependencies.
 */
import { WorkingFrequency } from "@/types";

export type dataItem = {
  date: string;
  hour: number;
  is_leave: boolean;
  note: string;
};

export type ItemProps = {
  employee_name: string;
  name: string;
  image: string;
  data: Array<dataItem>;
  status: string;
  working_hour: number;
  working_frequency: WorkingFrequency;
};

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type teamStateActionType = "SET" | "UPDATE";

export type DateProps = {
  startDate: string;
  endDate: string;
  key: string;
  dates: string[];
};
