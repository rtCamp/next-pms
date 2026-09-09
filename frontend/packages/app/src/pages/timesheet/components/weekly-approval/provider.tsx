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
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { GroupedDay, ModalView, WeeklyApprovalTarget } from "./types";
import { convertTimesheetToEntries, groupEntriesByDay } from "./utils";

export interface WeeklyApprovalContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: ModalView;
  setCurrentView: (view: ModalView) => void;
  isLoading: boolean;
  employee: string;
  employeeName: string;
  avatarUrl?: string;
  dateRange: string;
  totalHours: number;
  dailyWorkingHours: number;
  isReadOnly: boolean;
  projectName?: string;
  rejectionError: string | null;
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

interface WeeklyApprovalProviderProps extends WeeklyApprovalTarget {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Provider component for the Weekly Approval modal.
 * Manages all state, data fetching, and callbacks for the approval workflow.
 *
 * @param employee - The employee ID whose timesheet is being reviewed
 * @param employeeName - That employee's display name, supplied by the page that opened the
 *   modal rather than refetched, since a project manager cannot read the Employee document
 * @param avatarUrl - That employee's avatar, supplied the same way
 * @param startDate - The start date of the week to review in "YYYY-MM-DD" format
 * @param open - Whether the modal is open
 * @param onOpenChange - Callback to update the modal open state
 * @param project - Restricts the review to one project, for the Project Manager persona
 * @param projectName - Display name of that project
 * @param children - Child components that will have access to the context
 */
export const WeeklyApprovalProvider = ({
  employee,
  employeeName,
  avatarUrl,
  startDate,
  open,
  onOpenChange,
  project,
  projectName,
  children,
}: WeeklyApprovalProviderProps) => {
  const toast = useToasts();
  const [currentView, setCurrentView] = useState<ModalView>("approval");
  const [checkedDays, setCheckedDays] = useState<Set<string>>(new Set());
  const [rejectionError, setRejectionError] = useState<string | null>(null);

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
      // A Timesheet is one document per employee, day and project, so scoping the review to
      // a project is a filter on the parent rather than a different payload shape.
      ...(project
        ? {
            filters: JSON.stringify([
              ["Timesheet", "parent_project", "=", project],
            ]),
          }
        : {}),
    },
  );

  const timesheetData = useMemo(() => convertTimesheetToEntries(data), [data]);
  const groupedByDay = useMemo(
    () => groupEntriesByDay(timesheetData.entries),
    [timesheetData.entries],
  );
  const totalHours = timesheetData.totalHours;
  const dailyWorkingHours = timesheetData.dailyWorkingHours;
  // Derived from the days on screen rather than the week's stored status: under
  // project-wise approval that status describes the whole week, including projects this
  // reviewer is not looking at.
  const isReadOnly =
    groupedByDay.length > 0 &&
    groupedByDay.every((dayGroup) => dayGroup.isDecided);
  const dateRange = timesheetData.dateRange;

  // Initialize checkedDays with every day still open to a decision when data loads
  const actionableDays = groupedByDay.filter((dayGroup) => !dayGroup.isDecided);
  if (checkedDays.size === 0 && actionableDays.length > 0) {
    setCheckedDays(new Set(actionableDays.map((dayGroup) => dayGroup.day)));
  }

  const handleDayCheckChange = useCallback(
    (day: string, checked: boolean) => {
      if (isReadOnly) {
        return;
      }

      setCheckedDays((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(day);
        } else {
          newSet.delete(day);
        }
        return newSet;
      });
    },
    [isReadOnly],
  );

  const getCheckedDates = useCallback(() => {
    return groupedByDay
      .filter((dayGroup) => checkedDays.has(dayGroup.day))
      .map((dayGroup) => dayGroup.entries[0].date);
  }, [groupedByDay, checkedDays]);

  const handleReject = useCallback(() => {
    if (isReadOnly) {
      return;
    }

    setRejectionError(null);
    mutate();
    setCurrentView("rejection");
  }, [isReadOnly, mutate]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        setRejectionError(null);
        setCurrentView("approval");
      }
    },
    [onOpenChange],
  );

  const handleTimesheetUpdate = useCallback(
    async (
      timesheetId: string,
      taskId: string,
      description: string,
      hours: number,
      parent: string,
      day: string,
    ) => {
      if (isReadOnly) {
        return;
      }

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
    [isReadOnly, updateTimesheet, employee, toast, mutate],
  );

  const handleApproveSubmit = useCallback(async () => {
    if (isReadOnly) {
      return;
    }

    const dates = getCheckedDates();
    try {
      const res = await approveOrRejectTimesheet({
        dates,
        status: "Approved",
        employee,
        project,
      });
      toast.success(res.message);
      mutate();
      handleOpenChange(false);
    } catch (error) {
      const message = parseFrappeErrorMsg(error as FrappeError);
      toast.error(message);
    }
  }, [
    getCheckedDates,
    approveOrRejectTimesheet,
    employee,
    project,
    isReadOnly,
    toast,
    mutate,
    handleOpenChange,
  ]);

  const handleRejectionSubmit = useCallback(
    async (reason: string) => {
      if (isReadOnly) {
        return;
      }

      const dates = getCheckedDates();
      try {
        setRejectionError(null);
        const res = await approveOrRejectTimesheet({
          dates,
          status: "Rejected",
          employee,
          note: reason,
          project,
        });
        toast.success(res.message);
        mutate();
        handleOpenChange(false);
      } catch (error) {
        setRejectionError(parseFrappeErrorMsg(error as FrappeError));
      }
    },
    [
      getCheckedDates,
      approveOrRejectTimesheet,
      employee,
      project,
      isReadOnly,
      toast,
      mutate,
      handleOpenChange,
    ],
  );

  const value: WeeklyApprovalContextValue = useMemo(
    () => ({
      open,
      onOpenChange: handleOpenChange,
      currentView,
      setCurrentView,
      isLoading,
      employee,
      employeeName,
      avatarUrl,
      dateRange,
      totalHours,
      dailyWorkingHours,
      isReadOnly,
      projectName,
      rejectionError,
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
      handleOpenChange,
      currentView,
      isLoading,
      employee,
      employeeName,
      avatarUrl,
      dateRange,
      totalHours,
      dailyWorkingHours,
      isReadOnly,
      projectName,
      rejectionError,
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
