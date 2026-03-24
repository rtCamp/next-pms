/**
 * Internal dependencies.
 */
import { useState } from "react";
import { UnderConstruction } from "@/components/under-construction";
import WeeklyApproval from "../components/weekly-approval";

function TimesheetTeamPage() {
  const [isWeeklyApprovalModalOpen, setIsWeeklyApprovalModalOpen] =
    useState(true);
  return (
    <div>
      <UnderConstruction />
      <WeeklyApproval
        open={isWeeklyApprovalModalOpen}
        onOpenChange={setIsWeeklyApprovalModalOpen}
      />
    </div>
  );
}

export default TimesheetTeamPage;
