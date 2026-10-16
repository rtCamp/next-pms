import { inject, provide, reactive, type InjectionKey } from "vue";
import { dayjs } from "frappe-ui";

/** What the Add time dialog opens with; unset fields start empty. */
export interface AddTimePrefill {
  /** `YYYY-MM-DD`; today when unset. */
  date?: string;
  project?: string;
  projectLabel?: string;
  task?: string;
  taskLabel?: string;
  /** Logs time for this employee (team and project pages). */
  employeeId?: string;
  employeeLabel?: string;
}

/** The week a Submit for approval dialog is for. */
export interface SubmitApprovalWeek {
  startDate: string;
  endDate: string;
  totalHours: number;
}

function createTimesheetDialogs() {
  const state = reactive({
    addTime: { open: false, prefill: {} as AddTimePrefill },
    addLeave: { open: false },
    submitApproval: {
      open: false,
      week: { startDate: "", endDate: "", totalHours: 0 } as SubmitApprovalWeek,
    },
  });

  return {
    state,
    openAddTime(prefill: AddTimePrefill = {}) {
      state.addTime.prefill = {
        ...prefill,
        date: prefill.date || dayjs().format("YYYY-MM-DD"),
      };
      state.addTime.open = true;
    },
    openAddLeave() {
      state.addLeave.open = true;
    },
    openSubmitApproval(week: SubmitApprovalWeek) {
      state.submitApproval.week = week;
      state.submitApproval.open = true;
    },
  };
}

export type TimesheetDialogs = ReturnType<typeof createTimesheetDialogs>;

const timesheetDialogsKey: InjectionKey<TimesheetDialogs> =
  Symbol("timesheetDialogs");

/**
 * Creates the page's dialog state (Add time, Add time-off, Submit for approval) and
 * provides it, so rows and the header anywhere below can open a dialog with a prefill.
 */
export function provideTimesheetDialogs(): TimesheetDialogs {
  const dialogs = createTimesheetDialogs();
  provide(timesheetDialogsKey, dialogs);
  return dialogs;
}

/** The dialog state provided by the timesheet page this component is on. */
export function useTimesheetDialogs(): TimesheetDialogs {
  const dialogs = inject(timesheetDialogsKey);
  if (!dialogs) {
    throw new Error(
      "useTimesheetDialogs() needs provideTimesheetDialogs() in a parent",
    );
  }
  return dialogs;
}
