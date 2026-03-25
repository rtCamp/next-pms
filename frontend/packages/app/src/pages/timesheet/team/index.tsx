/**
 * Internal dependencies.
 */
import { useCallback, useState } from "react";
import { UnderConstruction } from "@/components/under-construction";
import WeeklyApproval from "./weekly-approval";

function TimesheetTeamPage() {
  const [employee, setEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isWeeklyApprovalOpen, setIsWeeklyApprovalOpen] = useState(false);

  const openWeeklyApproval = useCallback((employeeId: string, date: string) => {
    setEmployee(employeeId);
    setStartDate(date);
    setIsWeeklyApprovalOpen(true);
  }, []);

  return (
    <div>
      <UnderConstruction />
      <WeeklyApproval
        employee={employee}
        startDate={startDate}
        open={isWeeklyApprovalOpen}
        onOpenChange={setIsWeeklyApprovalOpen}
      />
    </div>
  );
}

export default TimesheetTeamPage;
