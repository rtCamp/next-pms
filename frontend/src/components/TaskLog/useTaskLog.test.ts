import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { toast } from "frappe-ui";
import { ApiError, deferred, mockApi } from "@/test/api";
import { unmountAll, withSetup } from "@/test/withSetup";
import type { TaskLogResponse, TaskResponse } from "./types";
import { useTaskLog } from "./useTaskLog";

const GET_TASK = "next_pms.timesheet.api.task.get_task";
const GET_LOG = "next_pms.timesheet.api.task.get_task_log";

const TASK: TaskResponse = {
  subject: "Fix login",
  status: "",
  project: "P-1",
  project_name: "Website",
  expected_time: 4,
  actual_time: null,
  exp_end_date: "",
  gh_link: "https://github.com/acme/web/issues/1",
  worked_by: [
    { employee: "E-1", employee_name: "Ada", image: null, total_hour: 3 },
    { employee: "E-2", employee_name: "Bo", image: "/bo.png", total_hour: 1 },
  ],
};

const LOG: TaskLogResponse = {
  "2026-10-15": [
    {
      employee: "E-1",
      hours: 2,
      description: ["<p>Debugged</p>", "<p>Fixed</p>"],
    },
    { employee: "E-9", hours: 1, description: ["Unknown worker"] },
  ],
  "2026-10-14": [{ employee: "E-2", hours: 1, description: ["Reviewed"] }],
};

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(2026, 9, 16, 10), toFake: ["Date"] });
});

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function api() {
  return mockApi({ [GET_TASK]: () => TASK, [GET_LOG]: () => LOG });
}

describe("useTaskLog", () => {
  it("loads the task and the last 15 days of its log", async () => {
    const server = api();
    const { result } = await withSetup(() => useTaskLog({ task: "T-1" }));
    expect(result.loading.value).toBe(true);
    await vi.waitFor(() => expect(result.loading.value).toBe(false));

    const dates = {
      task: "T-1",
      start_date: "2026-10-01",
      end_date: "2026-10-16",
    };
    expect(server.requestsTo(GET_TASK)[0].params).toEqual(dates);
    expect(server.requestsTo(GET_LOG)[0].params).toEqual(dates);

    const ada = {
      employeeId: "E-1",
      employeeName: "Ada",
      image: null,
      totalHours: 3,
    };
    const bo = {
      employeeId: "E-2",
      employeeName: "Bo",
      image: "/bo.png",
      totalHours: 1,
    };
    expect(result.details.value).toEqual({
      subject: "Fix login",
      status: "Open",
      projectName: "Website",
      dueDate: undefined,
      ghLink: "https://github.com/acme/web/issues/1",
      actualHours: 0,
      estimatedHours: 4,
      workedBy: [ada, bo],
    });
    expect(result.entries.value).toEqual([
      {
        date: "2026-10-15",
        employee: ada,
        description: "<p>Debugged</p>\n<p>Fixed</p>",
        hours: 2,
      },
      { date: "2026-10-14", employee: bo, description: "Reviewed", hours: 1 },
    ]);
  });

  it("limits the log and workers to one employee", async () => {
    const server = api();
    const { result } = await withSetup(() =>
      useTaskLog({ task: "T-1", employee: "E-2" }),
    );
    await vi.waitFor(() => expect(result.details.value).not.toBeNull());
    expect(server.requestsTo(GET_LOG)[0].params.employee).toBe("E-2");
    expect(server.requestsTo(GET_TASK)[0].params).not.toHaveProperty(
      "employee",
    );
    expect(result.details.value?.workedBy.map((w) => w.employeeId)).toEqual([
      "E-2",
    ]);
    expect(result.entries.value.map((e) => e.employee.employeeId)).toEqual([
      "E-2",
    ]);
  });

  it("loads nothing without a task, then loads when one is set", async () => {
    const server = api();
    const task = ref<string | null>(null);
    const { result } = await withSetup(() => useTaskLog({ task }));
    await nextTick();
    expect(server.requests).toHaveLength(0);
    expect(result.loading.value).toBe(false);

    task.value = "T-1";
    await vi.waitFor(() => expect(result.details.value).not.toBeNull());
  });

  it("reloads when the range changes", async () => {
    const server = api();
    const { result } = await withSetup(() => useTaskLog({ task: "T-1" }));
    await vi.waitFor(() => expect(result.loading.value).toBe(false));

    result.range.value = 7;
    await vi.waitFor(() => expect(server.requestsTo(GET_LOG)).toHaveLength(2));
    expect(server.requestsTo(GET_LOG)[1].params.start_date).toBe("2026-10-09");
  });

  it("keeps the newest task's data when an older response lands late", async () => {
    const slow = deferred();
    mockApi({
      [GET_TASK]: ({ params }) =>
        params.task === "T-1"
          ? slow.promise.then(() => ({ ...TASK, subject: "Old" }))
          : { ...TASK, subject: "New" },
      [GET_LOG]: () => LOG,
    });
    const task = ref("T-1");
    const { result } = await withSetup(() => useTaskLog({ task }));
    task.value = "T-2";
    await vi.waitFor(() => expect(result.details.value?.subject).toBe("New"));

    slow.resolve(null);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.details.value?.subject).toBe("New");
  });

  it("shows an error toast when loading fails", async () => {
    mockApi({
      [GET_TASK]: () => new ApiError("Task not found"),
      [GET_LOG]: () => LOG,
    });
    const error = vi.spyOn(toast, "error").mockImplementation(() => "");
    const { result } = await withSetup(() => useTaskLog({ task: "T-1" }));
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith("Task not found"),
    );
    expect(result.loading.value).toBe(false);
  });
});
