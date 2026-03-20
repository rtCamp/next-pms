import React, { useEffect, useState } from "react";
import {
  getFormatedDate,
  getTodayDate,
  prettyDate,
} from "@next-pms/design-system";
import {
  TaskProgress,
  TaskStatus,
  type TaskStatusType,
} from "@next-pms/design-system/components";
import {
  mergeClassNames as cn,
  floatToTime,
} from "@next-pms/design-system/utils";
import {
  Avatar,
  Badge,
  Dialog,
  Select,
  Spinner,
} from "@rtcamp/frappe-ui-react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";
import { CalendarFoldIcon, Folder } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { parseFrappeErrorMsg } from "@/lib/utils";

type BadgeItem = {
  icon: React.ReactNode;
  text: string;
};

type TaskWorker = {
  employee: string;
  employeeName: string;
  image: string | null;
  totalHours: number;
};

type TaskLogList = {
  [date: string]: TaskLog[];
};

type TaskLog = {
  description: string;
  employee: string;
  hours: number;
};

type TaskModalProps = {
  task: string | null;
  open: boolean;
  status: TaskStatusType;
  label: string;
  badges?: BadgeItem[];
  actualHours: number;
  estimatedHours: number;
  onOpenChange: (open: boolean) => void;
};

const TaskModal: React.FC<TaskModalProps> = ({ task, open, onOpenChange }) => {
  if (!task) {
    return null;
  }

  const toast = useToasts();
  const user = useUser();
  const [startDate, setStartDate] = useState<string>(
    getFormatedDate(addDays(getTodayDate(), -15)),
  );
  const endDate = getTodayDate();

  const dateMap = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 15 days", value: "15" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 60 days", value: "60" },
    { label: "Last 90 days", value: "90" },
    { label: "Last 180 days", value: "180" },
    { label: "Last 365 days", value: "365" },
  ];

  const { data, isLoading, error } = useFrappeGetCall(
    "next_pms.timesheet.api.task.get_task",
    {
      task: task,
      start_date: startDate,
      end_date: endDate,
    },
  );

  const {
    subject: label,
    project_name: projectName,
    actual_time: actualHours,
    expected_time: estimatedHours,
    status = "Open",
    worked_by: workedByRaw,
  } = data?.message || {};

  const workedBy: TaskWorker[] = (workedByRaw || []).map(
    (worker: {
      employee: string;
      employee_name: string;
      image: string | null;
      total_hour: number;
    }) => ({
      employee: worker.employee,
      employeeName: worker.employee_name,
      image: worker.image,
      totalHours: worker.total_hour,
    }),
  );

  const badges: BadgeItem[] = [
    {
      icon: <CalendarFoldIcon size={12} />,
      text: prettyDate(data?.message?.due_date || "2026-03-01").date,
    },
    {
      icon: <Folder size={12} />,
      text: projectName || "",
    },
  ];

  const worker: TaskWorker = workedBy.filter(
    (worker: TaskWorker) => worker.employee === user?.employee,
  )[0];

  const {
    data: logs,
    isLoading: isLogLoading,
    error: logError,
  } = useFrappeGetCall("next_pms.timesheet.api.task.get_task_log", {
    task: task,
    start_date: startDate,
    end_date: endDate,
  });

  // filter the timesheets for the current user
  const { message: taskLogs }: { message: TaskLogList } = logs || {
    message: {},
  };
  const userTaskLogs = Object.entries(taskLogs || {}).reduce(
    (acc: Record<string, TaskLog[]>, [date, logs]) => {
      const filteredLogs = logs.filter(
        (log: TaskLog) => log.employee === user?.employee,
      );
      if (filteredLogs.length > 0) {
        acc[date] = filteredLogs;
      }
      return acc;
    },
    {} as Record<string, TaskLog[]>,
  );

  useEffect(() => {
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast.error(err);
    }
    if (logError) {
      const err = parseFrappeErrorMsg(logError);
      toast.error(err);
    }
  }, [error, logError]);

  // Calculate progress percentage
  const progress =
    estimatedHours === 0 ? 0 : Math.round((actualHours / estimatedHours) * 100);

  const handleDateRangeChange = (value: string | undefined) => {
    if (!value) return;
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
            <div className="flex items-center gap-x-2 gap-y-1.5">
              <TaskStatus status={status} />
              <div className="text-lg font-semibold">{label}</div>
            </div>
          );
        },
        size: "md",
      }}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1 -mt-4 ml-6">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant="subtle"
                  size="md"
                  prefix={badge.icon}
                >
                  {badge.text}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-4 text-base">
            <div className="flex gap-0.75 mb-0.5">
              <div className="flex gap-1">
                <span
                  className={cn(
                    "font-medium",
                    progress > 100 && "text-surface-red-7",
                  )}
                >
                  {floatToTime(actualHours, 2)}
                </span>
                <span className="text-ink-gray-5">Actual</span>
              </div>
              <span className="text-ink-gray-5">/</span>
              <div className="flex gap-1">
                <span>{floatToTime(estimatedHours, 2)}</span>
                <span className="text-ink-gray-5">Est.</span>
              </div>
            </div>

            <div className="text-ink-gray-6">{progress}%</div>
          </div>

          <TaskProgress value={progress} className="mt-2.5" />

          <div className="flex justify-between items-center mt-6">
            <div className="flex justify-between items-center rounded bg-surface-gray-2 px-2 py-1.5 gap-1">
              <Avatar
                size="xs"
                label={worker?.employeeName || ""}
                image={worker?.image || ""}
              />
              <span className="text-base">
                {floatToTime(worker?.totalHours || 0, 2)}
              </span>
            </div>

            <Select
              className="w-auto"
              onChange={(value) => {
                handleDateRangeChange(value);
              }}
              options={dateMap}
              placeholder="Select option"
              value="30"
            />
          </div>

          <div className="flex overflow-y-auto flex-col gap-3 mt-3 max-h-54 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-surface-gray-4">
            {userTaskLogs && Object.entries(userTaskLogs).length > 0 ? (
              Object.entries(userTaskLogs).map(([date, logs]) => (
                <React.Fragment key={date}>
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="pb-3 border-b border-outline-gray-modals text-ink-gray-6 last:border-none"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <Badge variant="subtle" size="md">
                          {floatToTime(log.hours, 2)}
                        </Badge>
                        <span className="text-base">
                          {prettyDate(date).date}
                        </span>
                      </div>

                      <div key={log.description}>{log.description}</div>
                    </div>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <p className="text-base text-center text-ink-gray-5">
                No time logs found for the selected date range.
              </p>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
};

export default TaskModal;
