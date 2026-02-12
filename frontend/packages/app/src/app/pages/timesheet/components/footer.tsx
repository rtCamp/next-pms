/**
 * External dependencies
 */
import { useCallback } from "react";
/**
 * Internal dependencies
 */
import AddLeave from "@/app/components/add-leave";
import AddTime from "@/app/components/add-time";
import { Approval } from "./approval";
import { EditTime } from "./editTime";
import ImportFromGoogleCalendarDialog from "./importFromGoogleCalendarDialog";
import type { FooterProps } from "./types";

export const Footer = ({
  timesheet,
  user,
  dispatch,
  callback,
}: FooterProps) => {
  const onOpenChange = useCallback(() => {
    dispatch({ type: "SET_DIALOG_STATE", payload: false });
  }, [dispatch]);

  const onCloseEditDialog = useCallback(() => {
    dispatch({ type: "SET_EDIT_DIALOG_STATE", payload: false });
  }, [dispatch]);

  return (
    <>
      {timesheet.isDialogOpen && (
        <AddTime
          open={timesheet.isDialogOpen}
          onOpenChange={onOpenChange}
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
          onClose={onCloseEditDialog}
          user={user}
        />
      )}
      {timesheet.isAprrovalDialogOpen && (
        <Approval user={user} dispatch={dispatch} timesheetState={timesheet} />
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
            dispatch({
              type: "SET_IMPORT_FROM_GOOGLE_CALENDAR_DIALOG_STATE",
              payload: false,
            });
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
