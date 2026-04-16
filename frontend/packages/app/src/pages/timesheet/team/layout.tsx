/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { getTodayDate } from "@next-pms/design-system";
import { Button } from "@rtcamp/frappe-ui-react";
import { CalendarX2, Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { TimesheetBreadcrumbs } from "@/pages/timesheet/components/timesheet-breadcrumbs";
import AddEmployeeLeave from "./add-employee-leave";
import AddEmployeeTime from "./add-employee-time";

function TeamTimesheetLayout() {
  const [initialDate, setInitialDate] = useState(getTodayDate());
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const handleAddTime = useCallback((date?: string) => {
    setInitialDate(date || getTodayDate());
    setIsTimeDialogOpen(true);
  }, []);

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
              iconLeft={() => <CalendarX2 />}
            />
          )}

          <Button
            variant="solid"
            onClick={() => handleAddTime()}
            label="Add time"
            iconLeft={() => <Plus />}
          />
        </div>
      </Header>

      <Outlet />

      <AddEmployeeTime
        initialDate={initialDate}
        open={isTimeDialogOpen}
        onOpenChange={setIsTimeDialogOpen}
        onSuccess={() => setIsTimeDialogOpen(false)}
      />
      <AddEmployeeLeave
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
      />
    </>
  );
}

export default TeamTimesheetLayout;
