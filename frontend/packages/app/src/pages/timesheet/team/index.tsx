/**
 * Internal dependencies.
 */
import { useState } from "react";
import { UnderConstruction } from "@/components/under-construction";
import WeeklyRejection from "../components/submit-rejection";
import WeeklyApproval from "../components/weekly-approval";

function TimesheetTeamPage() {
  const [isWeeklyApprovalModalOpen, setIsWeeklyApprovalModalOpen] =
    useState(true);
  const [isWeeklyRejectionModalOpen, setIsWeeklyRejectionModalOpen] =
    useState(false);
  return (
    <div>
      <UnderConstruction />
      <WeeklyApproval
        employee="HR-EMP-00001"
        startDate="2026-03-15"
        open={isWeeklyApprovalModalOpen}
        onOpenChange={setIsWeeklyApprovalModalOpen}
      />
      <WeeklyRejection
        open={isWeeklyRejectionModalOpen}
        onOpenChange={setIsWeeklyRejectionModalOpen}
      />
    </div>
  );
}

export default TimesheetTeamPage;
