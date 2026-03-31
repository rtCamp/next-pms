import { useMemo } from "react";
import { FrappeError, useFrappeGetCall } from "frappe-react-sdk";
import { ResponseLogItem, TaskLog, TaskWorker } from "./types";

type UseTaskLogOptions = {
  task: string;
  startDate: string;
  endDate: string;
  employeeId?: string;
};

type UseTaskLogReturn = {
  isLoading: boolean;
  error?: FrappeError;
  taskDetails: {
    label: string;
    projectName: string;
    actualHours: number;
    estimatedHours?: number;
    status: string;
    dueDate?: string;
    workedBy: TaskWorker[];
  };
  taskLogs: TaskLog[];
};

const useTaskLog = ({
  task,
  startDate,
  endDate,
  employeeId,
}: UseTaskLogOptions): UseTaskLogReturn => {
  // Fetch task details.
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
    exp_end_date: dueDate,
    status = "Open",
    worked_by: workedByRaw,
  } = data?.message || {};

  let workedBy: TaskWorker[] = (workedByRaw || []).map(
    (worker: {
      employee: string;
      employee_name: string;
      image: string | null;
      total_hour: number;
    }) => ({
      employeeId: worker.employee,
      employeeName: worker.employee_name,
      image: worker.image,
      totalHours: worker.total_hour,
    }),
  );

  if (employeeId) {
    workedBy = workedBy.filter(
      (worker: TaskWorker) => worker.employeeId === employeeId,
    );
  }

  const employeeMap: { [employeeId: string]: TaskWorker } = workedBy.reduce(
    (acc: { [employeeId: string]: TaskWorker }, worker: TaskWorker) => {
      acc[worker.employeeId] = worker;
      return acc;
    },
    {},
  );

  // Fetch task logs.
  const {
    data: logs,
    isLoading: isLogLoading,
    error: logError,
  } = useFrappeGetCall("next_pms.timesheet.api.task.get_task_log", {
    task: task,
    start_date: startDate,
    end_date: endDate,
    employee: employeeId,
  });

  const taskLogs = useMemo(() => {
    const result: TaskLog[] = [];

    if (logs?.message) {
      Object.entries(logs.message).forEach(([date, item]) => {
        (item as ResponseLogItem[]).forEach((entry: ResponseLogItem) => {
          const employee = employeeMap[entry.employee];
          if (employee) {
            result.push({
              date,
              employee,
              description: entry.description,
              hours: entry.hours,
            });
          }
        });
      });
    }

    return result;
  }, [logs?.message, employeeMap]);

  return {
    isLoading: isLoading || isLogLoading,
    error: error || logError,
    taskDetails: {
      label,
      projectName,
      actualHours,
      estimatedHours,
      status,
      dueDate,
      workedBy,
    },
    taskLogs: taskLogs,
  };
};

export default useTaskLog;
