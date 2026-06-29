/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { getTodayDate } from "@next-pms/design-system";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddMd, TimeOff } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { UnsavedChangesProvider } from "@/pages/allocations/unsavedChanges/UnsavedChangesProvider";
import AddLeave from "@/pages/timesheet/components/add-leave";
import AddTime from "@/pages/timesheet/components/add-time";
import SubmitApproval from "@/pages/timesheet/components/submit-approval";
import { TimesheetBreadcrumbs } from "@/pages/timesheet/components/timesheet-breadcrumbs";
import type {
  OpenAddTimeDialogOptions,
  TimesheetOutletContext,
} from "../outletContext";

function PersonalTimesheetLayout() {
  const [addTimePrefill, setAddTimePrefill] =
    useState<OpenAddTimeDialogOptions>({
      date: getTodayDate(),
      project: "",
      projectLabel: "",
      task: "",
      taskLabel: "",
    });
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isSubmitApprovalOpen, setIsSubmitApprovalOpen] = useState(false);
  const [submitApprovalDates, setSubmitApprovalDates] = useState({
    startDate: "",
    endDate: "",
    totalHours: 0,
  });

  const handleAddTime = useCallback(
    (prefill: OpenAddTimeDialogOptions = {}) => {
      setAddTimePrefill({
        date: getTodayDate(),
        project: "",
        projectLabel: "",
        task: "",
        taskLabel: "",
        ...prefill,
      });
      setIsTimeDialogOpen(true);
    },
    [],
  );

  const handleApproval = useCallback(
    (startDate: string, endDate: string, totalHours: number) => {
      setSubmitApprovalDates({ startDate, endDate, totalHours });
      setIsSubmitApprovalOpen(true);
    },
    [],
  );

  return (
    <UnsavedChangesProvider>
      <Header className="justify-between">
        <TimesheetBreadcrumbs />

        <div className="flex gap-2">
          {window.frappe?.boot?.user?.can_create.includes(
            "Leave Application",
          ) && (
            <Button
              className="text-ink-gray-7"
              onClick={() => setIsLeaveDialogOpen(true)}
              label="Add time-off"
              iconLeft={() => <TimeOff className="size-4 text-ink-gray-7" />}
            />
          )}

          <Button
            variant="solid"
            onClick={() => handleAddTime()}
            label="Add time"
            iconLeft={() => <AddMd className="size-4" />}
          />
        </div>
      </Header>

      <Outlet
        context={
          {
            openAddTimeDialog: handleAddTime,
            openAddLeaveDialog: () => setIsLeaveDialogOpen(true),
            handleApproval,
          } satisfies TimesheetOutletContext
        }
      />

      <AddTime
        initialDate={addTimePrefill.date || getTodayDate()}
        open={isTimeDialogOpen}
        onOpenChange={setIsTimeDialogOpen}
        onSuccess={() => setIsTimeDialogOpen(false)}
        project={addTimePrefill.project}
        projectLabel={addTimePrefill.projectLabel}
        task={addTimePrefill.task}
        taskLabel={addTimePrefill.taskLabel}
      />
      <AddLeave open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen} />
      <SubmitApproval
        open={isSubmitApprovalOpen}
        onOpenChange={setIsSubmitApprovalOpen}
        startDate={submitApprovalDates.startDate}
        endDate={submitApprovalDates.endDate}
        totalHours={submitApprovalDates.totalHours}
      />
    </UnsavedChangesProvider>
  );
}

export default PersonalTimesheetLayout;
