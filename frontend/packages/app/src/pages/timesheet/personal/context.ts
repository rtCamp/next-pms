/**
 * External dependencies.
 */
import type { ApprovalStatusType } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type {
  DataProp,
  TaskDataProps,
  TimesheetFilters,
} from "@/types/timesheet";

export interface PersonalTimesheetContextProps {
  state: {
    hasMoreWeeks: boolean;
    isLoadingPersonalData: boolean;
    timesheetData: DataProp;
    filters: TimesheetFilters;
    compositeFilters: FilterCondition[];
    likedTaskData: TaskDataProps[];
  };
  actions: {
    loadData: () => void;
    handleSearchChange: (value: string) => void;
    handleApprovalStatusChange: (value?: ApprovalStatusType | null) => void;
    handleCompositeFilterChange: (value: FilterCondition[]) => void;
  };
}

export const initialTimesheetData: DataProp = {
  working_hour: 0,
  working_frequency: "Per Day",
  data: {},
  leaves: [],
  holidays: [],
};

export const PersonalTimesheetContext =
  createContext<PersonalTimesheetContextProps>({
    state: {
      hasMoreWeeks: false,
      isLoadingPersonalData: false,
      timesheetData: initialTimesheetData,
      filters: {
        search: "",
        approvalStatus: null,
      },
      compositeFilters: [],
      likedTaskData: [],
    },
    actions: {
      loadData: () => null,
      handleSearchChange: () => null,
      handleApprovalStatusChange: () => null,
      handleCompositeFilterChange: () => null,
    },
  });

export const usePersonalTimesheet = <T>(
  selector: (state: PersonalTimesheetContextProps) => T,
) => {
  return useContextSelector(PersonalTimesheetContext, selector);
};
