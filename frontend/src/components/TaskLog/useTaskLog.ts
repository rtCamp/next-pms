import { ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import { dayjs, toast, useCall } from "frappe-ui";
import type { TaskStatusValue } from "@/components/TaskStatus";
import { errorMessage } from "@/utils/errors";
import { DEFAULT_TASK_LOG_RANGE } from "./constants";
import type {
  TaskLogDetails,
  TaskLogEntry,
  TaskLogResponse,
  TaskResponse,
  TaskWorker,
} from "./types";

type TaskLogParams = Record<string, string | undefined>;

interface UseTaskLogOptions {
  /** Task name; nothing loads while it's empty. */
  task: MaybeRefOrGetter<string | null | undefined>;
  /** Limits the log to one employee (the personal view). */
  employee?: MaybeRefOrGetter<string | null | undefined>;
}

/**
 * Loads a task's details and time log for the last `range` days, reloading when the task
 * or range changes. Errors show as toasts.
 */
export function useTaskLog({ task, employee }: UseTaskLogOptions) {
  const range = ref(DEFAULT_TASK_LOG_RANGE);

  const taskCall = useCall<TaskResponse, TaskLogParams>({
    url: "/api/v2/method/next_pms.timesheet.api.task.get_task",
    immediate: false,
  });
  const logCall = useCall<TaskLogResponse, TaskLogParams>({
    url: "/api/v2/method/next_pms.timesheet.api.task.get_task_log",
    immediate: false,
  });

  const details = ref<TaskLogDetails | null>(null);
  const entries = ref<TaskLogEntry[]>([]);
  const loading = ref(false);
  // Only the newest request may write; an older one can land after it.
  let latestRequest = 0;

  async function load() {
    const name = toValue(task);
    if (!name) return;
    const request = ++latestRequest;
    loading.value = true;
    const today = dayjs();
    const params = {
      task: name,
      start_date: today.subtract(range.value, "day").format("YYYY-MM-DD"),
      end_date: today.format("YYYY-MM-DD"),
    };
    const employeeId = toValue(employee) || undefined;
    const [taskData, logData] = await Promise.all([
      taskCall.submit(params),
      logCall.submit({ ...params, employee: employeeId }),
    ]);
    if (request !== latestRequest) return;
    loading.value = false;
    if (!taskData || !logData) {
      toast.error(errorMessage(taskCall.error ?? logCall.error));
      return;
    }
    let workedBy: TaskWorker[] = taskData.worked_by.map((worker) => ({
      employeeId: worker.employee,
      employeeName: worker.employee_name,
      image: worker.image,
      totalHours: worker.total_hour,
    }));
    if (employeeId) {
      workedBy = workedBy.filter((worker) => worker.employeeId === employeeId);
    }
    details.value = {
      subject: taskData.subject,
      status: (taskData.status || "Open") as TaskStatusValue,
      projectName: taskData.project_name ?? undefined,
      dueDate: taskData.exp_end_date || undefined,
      ghLink: taskData.gh_link || undefined,
      actualHours: taskData.actual_time ?? 0,
      estimatedHours: taskData.expected_time ?? 0,
      workedBy,
    };
    entries.value = toEntries(logData, workedBy);
  }

  watch([() => toValue(task), range], load, { immediate: true });

  return {
    range,
    details,
    entries,
    loading,
    reload: load,
  };
}

// The log is keyed by date; entries by someone missing from `worked_by` are dropped,
// as in the React dialog (it only knows names and images for listed workers).
function toEntries(
  log: TaskLogResponse,
  workedBy: TaskWorker[],
): TaskLogEntry[] {
  const workers = new Map(
    workedBy.map((worker) => [worker.employeeId, worker]),
  );
  return Object.entries(log).flatMap(([date, items]) =>
    items.flatMap((item) => {
      const employee = workers.get(item.employee);
      if (!employee) return [];
      return [
        {
          date,
          employee,
          description: item.description.join("\n"),
          hours: item.hours,
        },
      ];
    }),
  );
}
