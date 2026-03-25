/**
 * Internal dependencies.
 */
import { useCallback, useState } from "react";
import { UnderConstruction } from "@/components/under-construction";
import WeeklyApproval from "./weekly-approval";

function TimesheetTeamPage() {
  const [employee, setEmployee] = useState("HR-EMP-00001");
  const [startDate, setStartDate] = useState("2026-03-15");
  const [isWeeklyApprovalOpen, setIsWeeklyApprovalOpen] = useState(true);

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
