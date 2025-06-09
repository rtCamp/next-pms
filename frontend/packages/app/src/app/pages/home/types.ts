/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Internal dependencies
 */
import { ViewData } from "@/store/view";
import type { WorkingFrequency } from "@/types";
import type { dataItem } from "@/types/team";

export type HeaderProps = {
  homeState: HomeState;
  dispatch: React.Dispatch<Action>;
  viewData: ViewData;
};

export type DataItem = {
  data: dataItem[];
  name: string;
  image: string;
  employee_name: string;
  working_hour: number;
  working_frequency: WorkingFrequency;
  status: string;
};

export interface dataProps {
  data: any;
  dates: DateProps[];
  totalCount: number;
  hasMore: boolean;
}

export type DateProps = {
  startDate: string;
  endDate: string;
  key: string;
  dates: string[];
};
export type PayloadDateProps = {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
};
export type HomeState = {
  data: dataProps;
  action: "SET" | "UPDATE";
  isDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  employeeName: string;
  status: Array<string>;
  weekDate: string;
  pageLength: number;
  timesheet: {
    name: string;
    parent: string;
    task: string;
    date: string;
    description: string;
    hours: number;
    isUpdate: boolean;
    employee?: string;
  };
  start: number;
  isLoading: boolean;
  isNeedToFetchDataAfterUpdate: boolean;
  hasViewUpdated: boolean;
};

export type Action =
  | {
      type: "SET_DATA";
      payload: {
        data: any;
        dates: PayloadDateProps[];
        total_count: number;
        has_more: boolean;
      };
    }
  | { type: "SET_REFETCH_DATA"; payload: boolean }
  | { type: "SET_TIMESHEET"; payload: HomeState["timesheet"] }
  | { type: "SET_WEEK_DATE"; payload: string }
  | {
      type: "SET_FILTERS";
      payload: { employeeName: string; status: Array<string> };
    }
  | { type: "SET_STATUS"; payload: Array<string> }
  | { type: "SET_EMPLOYEE_NAME"; payload: string }
  | { type: "SET_START"; payload: number }
  | {
      type: "UPDATE_DATA";
      payload: {
        data: any;
        dates: PayloadDateProps[];
        total_count: number;
        has_more: boolean;
      };
    }
  | { type: "SET_HAS_VIEW_UPDATED"; payload: boolean };

export interface HomeComponentProps {
  viewData: ViewData;
}
