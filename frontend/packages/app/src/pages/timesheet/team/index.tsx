/**
 * Internal dependencies.
 */
import { useState } from "react";
import { UnderConstruction } from "@/components/under-construction";
import WeeklyRejection from "../components/submit-rejection";
import WeeklyApproval from "../components/weekly-approval";

function TimesheetTeamPage() {
  const [isWeeklyApprovalModalOpen, setIsWeeklyApprovalModalOpen] =
    useState(false);
  const [isWeeklyRejectionModalOpen, setIsWeeklyRejectionModalOpen] =
    useState(true);
  return (
    <div>
      <UnderConstruction />
      <WeeklyApproval
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
