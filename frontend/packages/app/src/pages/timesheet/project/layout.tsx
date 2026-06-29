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
import { TimesheetBreadcrumbs } from "@/pages/timesheet/components/timesheet-breadcrumbs";
import type {
  OpenAddTimeDialogOptions,
  TimesheetOutletContext,
} from "../outletContext";
import AddEmployeeLeave from "../team/add-employee-leave";
import AddEmployeeTime from "../team/add-employee-time";

function ProjectTimesheetLayout() {
  const [addTimePrefill, setAddTimePrefill] =
    useState<OpenAddTimeDialogOptions>({
      date: getTodayDate(),
      project: "",
      projectLabel: "",
      task: "",
      taskLabel: "",
      employeeId: "",
      employeeLabel: "",
    });
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const handleAddTime = useCallback(
    (prefill: OpenAddTimeDialogOptions = {}) => {
      setAddTimePrefill({
        date: getTodayDate(),
        project: "",
        projectLabel: "",
        task: "",
        taskLabel: "",
        employeeId: "",
        employeeLabel: "",
        ...prefill,
      });
      setIsTimeDialogOpen(true);
    },
    [],
  );

  return (
    <>
      <Header className="justify-between">
        <TimesheetBreadcrumbs />

        <div className="flex gap-2">
          {window.frappe?.boot?.user?.can_create.includes(
            "Leave Application",
          ) && (
            <Button
              onClick={() => setIsLeaveDialogOpen(true)}
              label="Add time-off"
              iconLeft={() => <TimeOff className="size-4" />}
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
            handleApproval: () => undefined,
          } satisfies TimesheetOutletContext
        }
      />

      <AddEmployeeTime
        initialDate={addTimePrefill.date || getTodayDate()}
        open={isTimeDialogOpen}
        onOpenChange={setIsTimeDialogOpen}
        onSuccess={() => setIsTimeDialogOpen(false)}
        project={addTimePrefill.project}
        projectLabel={addTimePrefill.projectLabel}
        task={addTimePrefill.task}
        taskLabel={addTimePrefill.taskLabel}
        employeeId={addTimePrefill.employeeId}
        employeeLabel={addTimePrefill.employeeLabel}
      />
      <AddEmployeeLeave
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
      />
    </>
  );
}

export default ProjectTimesheetLayout;
