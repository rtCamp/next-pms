/**
 * External dependencies.
 */
import React, { useEffect, useState } from "react";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system";
import { Spinner, taskStatusMap } from "@next-pms/design-system/components";
import { Dialog, Select } from "@rtcamp/frappe-ui-react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import Progress from "./components/progress";
import TaskEntryList from "./components/taskEntryList";
import TeamTimeSummary from "./components/teamTimeSummary";
import Title from "./components/title";
import useTaskLog from "./useTaskLog";
import TaskBadges from "../taskBadges";

type TeamTaskLogProps = {
  task: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const dateMap = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 15 days", value: "15" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 60 days", value: "60" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 180 days", value: "180" },
  { label: "Last 365 days", value: "365" },
];

const TeamTaskLog: React.FC<TeamTaskLogProps> = ({
  task,
  open,
  onOpenChange,
}) => {
  const toast = useToasts();
  const [selectedDays, setSelectedDays] = useState<string>("15");
  const [startDate, setStartDate] = useState<string>(
    getFormatedDate(addDays(getTodayDate(), -15)),
  );
  const endDate = getTodayDate();

  const { taskDetails, taskLogs, isLoading, error } = useTaskLog({
    task,
    startDate,
    endDate,
  });

  useEffect(() => {
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast.error(err);
    }
  }, [error]);

  const handleDateRangeChange = (value: string | undefined) => {
    if (!value) return;
    setSelectedDays(value);
    const days = parseInt(value, 10);
    const newStartDate = getFormatedDate(addDays(getTodayDate(), -days));
    setStartDate(newStartDate);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{
        title: () => {
          return (
            <Title
              taskName={taskDetails.label}
              status={taskStatusMap[taskDetails.status]}
            />
          );
        },
        size: "md",
      }}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <TaskBadges
            className="-mt-[5%] ml-6"
            projectName={taskDetails.projectName}
            dueDate={taskDetails.dueDate}
          />
          <Progress
            actualHours={taskDetails.actualHours}
            estimatedHours={taskDetails.estimatedHours}
          />

          <div className="flex justify-between items-center mt-6">
            <h4 className="text-base font-medium">Time entries</h4>

            <Select
              variant="ghost"
              className="w-auto"
              onChange={(value) => {
                handleDateRangeChange(value);
              }}
              options={dateMap}
              placeholder="Select option"
              value={selectedDays}
            />
          </div>

          <TeamTimeSummary workers={taskDetails.workedBy} className="mt-2" />
          <TaskEntryList taskLogs={taskLogs} className="mt-4" />
        </>
      )}
    </Dialog>
  );
};

export default TeamTaskLog;
