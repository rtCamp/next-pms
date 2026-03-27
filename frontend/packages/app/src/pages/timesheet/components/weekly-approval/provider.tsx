/**
 * External Dependencies
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { GroupedDay, ModalView } from "./types";
import { convertTimesheetToEntries, groupEntriesByDay } from "./utils";

export interface WeeklyApprovalContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: ModalView;
  setCurrentView: (view: ModalView) => void;
  isLoading: boolean;
  employee: string;
  employeeName: string;
  avatarUrl: string;
  dateRange: string;
  totalHours: number;
  groupedByDay: GroupedDay[];
  checkedDays: Set<string>;
  handleDayCheckChange: (day: string, checked: boolean) => void;
  handleTimesheetUpdate: (
    timesheetId: string,
    taskId: string,
    description: string,
    hours: number,
    parent: string,
    day: string,
  ) => Promise<void>;
  handleApproveSubmit: () => Promise<void>;
  handleRejectionSubmit: (reason: string) => Promise<void>;
  handleReject: () => void;
}

const WeeklyApprovalContext = createContext<WeeklyApprovalContextValue | null>(
  null,
);

interface WeeklyApprovalProviderProps {
  employee: string;
  startDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Provider component for the Weekly Approval modal.
 * Manages all state, data fetching, and callbacks for the approval workflow.
 *
 * @param employee - The employee ID whose timesheet is being reviewed
 * @param startDate - The start date of the week to review in "YYYY-MM-DD" format
 * @param open - Whether the modal is open
 * @param onOpenChange - Callback to update the modal open state
 * @param children - Child components that will have access to the context
 */
export const WeeklyApprovalProvider = ({
  employee,
  startDate,
  open,
  onOpenChange,
  children,
}: WeeklyApprovalProviderProps) => {
  const toast = useToasts();
  const [currentView, setCurrentView] = useState<ModalView>("approval");
  const [checkedDays, setCheckedDays] = useState<Set<string>>(new Set());

  const { call: updateTimesheet } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.update_timesheet_detail",
  );

  const { call: approveOrRejectTimesheet } = useFrappePostCall(
    "next_pms.timesheet.api.team.approve_or_reject_timesheet",
  );

  const { isLoading, data, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employee,
      start_date: startDate,
      max_week: 1,
    },
  );

  const { data: employeeData } = useFrappeGetDoc("Employee", employee);

  const timesheetData = useMemo(() => convertTimesheetToEntries(data), [data]);
  const groupedByDay = useMemo(
    () => groupEntriesByDay(timesheetData.entries),
    [timesheetData.entries],
  );
  const totalHours = timesheetData.totalHours;
  const dateRange = timesheetData.dateRange;
  const employeeName = employeeData?.employee_name || "";
  const avatarUrl = employeeData?.image || "";

  // Initialize checkedDays with all days when data loads
  if (checkedDays.size === 0 && groupedByDay.length > 0) {
    setCheckedDays(new Set(groupedByDay.map((dayGroup) => dayGroup.day)));
  }

  const handleDayCheckChange = useCallback((day: string, checked: boolean) => {
    setCheckedDays((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(day);
      } else {
        newSet.delete(day);
      }
      return newSet;
    });
  }, []);

  const getCheckedDates = useCallback(() => {
    return groupedByDay
      .filter((dayGroup) => checkedDays.has(dayGroup.day))
      .map((dayGroup) => dayGroup.entries[0].date);
  }, [groupedByDay, checkedDays]);

  const handleReject = useCallback(() => {
    mutate();
    setCurrentView("rejection");
  }, [mutate]);

  const handleTimesheetUpdate = useCallback(
    async (
      timesheetId: string,
      taskId: string,
      description: string,
      hours: number,
      parent: string,
      day: string,
    ) => {
      try {
        const res = await updateTimesheet({
          name: timesheetId,
          task: taskId,
          date: day,
          parent,
          description,
          hours,
          employee,
        });
        toast.success(res.message);
        mutate();
      } catch (error) {
        const message = parseFrappeErrorMsg(error as FrappeError);
        toast.error(message);
      }
    },
    [updateTimesheet, employee, toast, mutate],
  );

  const handleApproveSubmit = useCallback(async () => {
    const dates = getCheckedDates();
    try {
      const res = await approveOrRejectTimesheet({
        dates,
        status: "Approved",
        employee,
      });
      toast.success(res.message);
      mutate();
    } catch (error) {
      const message = parseFrappeErrorMsg(error as FrappeError);
      toast.error(message);
    }
    onOpenChange(false);
  }, [
    getCheckedDates,
    approveOrRejectTimesheet,
    employee,
    toast,
    onOpenChange,
    mutate,
  ]);

  const handleRejectionSubmit = useCallback(
    async (reason: string) => {
      const dates = getCheckedDates();
      try {
        const res = await approveOrRejectTimesheet({
          dates,
          status: "Rejected",
          employee,
          note: reason,
        });
        toast.success(res.message);
        mutate();
      } catch (error) {
        const message = parseFrappeErrorMsg(error as FrappeError);
        toast.error(message);
      }
      onOpenChange(false);
    },
    [
      getCheckedDates,
      approveOrRejectTimesheet,
      employee,
      toast,
      onOpenChange,
      mutate,
    ],
  );

  const value: WeeklyApprovalContextValue = useMemo(
    () => ({
      open,
      onOpenChange,
      currentView,
      setCurrentView,
      isLoading,
      employee,
      employeeName,
      avatarUrl,
      dateRange,
      totalHours,
      groupedByDay,
      checkedDays,
      handleDayCheckChange,
      handleTimesheetUpdate,
      handleApproveSubmit,
      handleRejectionSubmit,
      handleReject,
    }),
    [
      open,
      onOpenChange,
      currentView,
      isLoading,
      employee,
      employeeName,
      avatarUrl,
      dateRange,
      totalHours,
      groupedByDay,
      checkedDays,
      handleDayCheckChange,
      handleTimesheetUpdate,
      handleApproveSubmit,
      handleRejectionSubmit,
      handleReject,
    ],
  );

  return (
    <WeeklyApprovalContext.Provider value={value}>
      {children}
    </WeeklyApprovalContext.Provider>
  );
};

/**
 * Hook to access the Weekly Approval context.
 * Must be used within a WeeklyApprovalProvider.
 *
 * @throws Error if used outside of WeeklyApprovalProvider
 */
export const useWeeklyApproval = (): WeeklyApprovalContextValue => {
  const context = useContext(WeeklyApprovalContext);
  if (!context) {
    throw new Error(
      "useWeeklyApproval must be used within a WeeklyApprovalProvider",
    );
  }
  return context;
};
