/**
 * Internal dependencies.
 */
import { useCallback, useState } from "react";
import { UnderConstruction } from "@/components/under-construction";
import WeeklyApproval from "./weeklyApproval";

function TimesheetTeamPage() {
  const [employee, setEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isWeeklyApprovalOpen, setIsWeeklyApprovalOpen] = useState(false);

  /**
   * Opens the weekly approval modal for a specific employee's timesheet.
   *
   * @param employeeId - The unique identifier of the employee (e.g., "HR-EMP-00001")
   * @param date - The start date of the week to review in "YYYY-MM-DD" format
   */
  const openWeeklyApproval = useCallback((employeeId: string, date: string) => {
    setEmployee(employeeId);
    setStartDate(date);
    setIsWeeklyApprovalOpen(true);
  }, []);

  return (
    <div>
      <UnderConstruction />
      {employee !== "" && (
        <WeeklyApproval
          employee={employee}
          startDate={startDate}
          open={isWeeklyApprovalOpen}
          onOpenChange={setIsWeeklyApprovalOpen}
        />
      )}
    </div>
  );
}

export default TimesheetTeamPage;
