/**
 * Internal dependencies
 */
import AddLeave from "@/app/components/add-leave";
import AddTime from "@/app/components/add-time";
import { Approval } from "./approval";
import { EditTime } from "./editTime";
import ImportFromGoogleCalendarDialog from "./importFromGoogleCalendarDialog";
import type { FooterProps } from "./types";

export const Footer = ({ timesheet, user, dispatch, callback }: FooterProps) => {
  return (
    <>
      {timesheet.isDialogOpen && (
        <AddTime
          open={timesheet.isDialogOpen}
          onOpenChange={(data) => {
            dispatch({ type: "SET_DIALOG_STATE", payload: false });
            dispatch({ type: "SET_WEEK_DATE", payload: data?.date });
            callback();
          }}
          onSuccess={(data) => {
            dispatch({ type: "SET_WEEK_DATE", payload: data?.date });
            callback();
          }}
          initialDate={timesheet.timesheet.date}
          employee={user.employee}
          workingFrequency={user.workingFrequency}
          workingHours={user.workingHours}
          task={timesheet.timesheet.task}
          project={timesheet.timesheet.project}
          employeeName={user.employeeName}
        />
      )}
      {timesheet.isEditDialogOpen && (
        <EditTime
          employee={timesheet.timesheet.employee as string}
          date={timesheet.timesheet.date}
          task={timesheet.timesheet.task}
          open={timesheet.isEditDialogOpen}
          onClose={() => {
            dispatch({ type: "SET_EDIT_DIALOG_STATE", payload: false });
            dispatch({ type: "SET_WEEK_DATE", payload: timesheet.timesheet.date });
            callback();
          }}
          user={user}
        />
      )}
      {timesheet.isAprrovalDialogOpen && (
        <Approval
          user={user}
          dispatch={dispatch}
          timesheetState={timesheet}
          onClose={(data) => {
            dispatch({ type: "SET_WEEK_DATE", payload: data.start_date });
            callback();
          }}
        />
      )}
      {timesheet.isLeaveDialogOpen && (
        <AddLeave
          employee={user.employee}
          employeeName={user.employeeName}
          open={timesheet.isLeaveDialogOpen}
          onOpenChange={() => {
            dispatch({ type: "SET_LEAVE_DIALOG_STATE", payload: false });
            callback();
          }}
          onSuccess={() => {
            callback();
          }}
        />
      )}
      {timesheet.isImportFromGoogleCalendarDialogOpen && (
        <ImportFromGoogleCalendarDialog
          open={timesheet.isImportFromGoogleCalendarDialogOpen}
          onOpenChange={(date) => {
            dispatch({ type: "SET_IMPORT_FROM_GOOGLE_CALENDAR_DIALOG_STATE", payload: false });
            callback();
            if (date) {
              dispatch({ type: "SET_WEEK_DATE", payload: date });
            }
          }}
        />
      )}
    </>
  );
};
