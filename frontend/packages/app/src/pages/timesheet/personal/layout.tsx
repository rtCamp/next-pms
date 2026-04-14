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
import AddLeave from "@/pages/timesheet/components/add-leave";
import AddTime from "@/pages/timesheet/components/add-time";
import SubmitApproval from "@/pages/timesheet/components/submit-approval";
import { TimesheetBreadcrumbs } from "@/pages/timesheet/components/timesheet-breadcrumbs";
import type { TimesheetOutletContext } from "../outletContext";

function PersonalTimesheetLayout() {
  const [initialDate, setInitialDate] = useState(getTodayDate());
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isSubmitApprovalOpen, setIsSubmitApprovalOpen] = useState(false);
  const [submitApprovalDates, setSubmitApprovalDates] = useState({
    startDate: "",
    endDate: "",
    totalHours: 0,
  });

  const handleAddTime = useCallback((date?: string) => {
    setInitialDate(date || getTodayDate());
    setIsTimeDialogOpen(true);
  }, []);

  const handleApproval = useCallback(
    (startDate: string, endDate: string, totalHours: number) => {
      setSubmitApprovalDates({ startDate, endDate, totalHours });
      setIsSubmitApprovalOpen(true);
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
        initialDate={initialDate}
        open={isTimeDialogOpen}
        onOpenChange={setIsTimeDialogOpen}
        onSuccess={() => setIsTimeDialogOpen(false)}
      />
      <AddLeave open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen} />
      <SubmitApproval
        open={isSubmitApprovalOpen}
        onOpenChange={setIsSubmitApprovalOpen}
        startDate={submitApprovalDates.startDate}
        endDate={submitApprovalDates.endDate}
        totalHours={submitApprovalDates.totalHours}
      />
    </>
  );
}

export default PersonalTimesheetLayout;
