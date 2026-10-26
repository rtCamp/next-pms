import { afterEach, describe, expect, it } from "vitest";
import { getConfig, setConfig } from "frappe-ui";
import {
  assigneeIds,
  deleteTodoMessage,
  emptyTodoForm,
  formatTodoCount,
  formatTodoDateTime,
  hasTodoCustomFields,
  isSameRecord,
  linkedRecordQuery,
  todosByRecord,
  linkKey,
  linkOptions,
  statusColor,
  statusHoverColor,
  statusIcon,
  statusOptions,
  todoFields,
  todoStatuses,
  todoTitle,
  toTodoFields,
  unlinkTodoMessage,
  validateTodo,
  resolveTodos,
} from "./todos";
import type { LinkedRecord, TodoDoc, TodoForm } from "./types";

const milestone: LinkedRecord = {
  doctype: "Project Timeline Item",
  name: "PTI-1",
  title: "Launch",
  type: "Milestone",
};

const doc = (overrides: Partial<TodoDoc> = {}): TodoDoc => ({
  name: "TD-1",
  allocated_to: "a@example.com",
  description: "<p>Write the brief</p>",
  status: "Open",
  priority: "Medium",
  reference_type: "Project",
  reference_name: "PROJ-1",
  creation: "2026-10-01 10:00:00",
  modified: "2026-10-01 10:00:00",
  ...overrides,
});

const form = (overrides: Partial<TodoForm> = {}): TodoForm => ({
  ...emptyTodoForm("a@example.com"),
  title: "Brief",
  startAt: "2026-10-01 09:00:00",
  endAt: "2026-10-01 17:00:00",
  ...overrides,
});

describe("hasTodoCustomFields", () => {
  const boot = window.boot;
  afterEach(() => {
    window.boot = boot;
  });

  it("follows the boot flag", () => {
    window.boot = { sitename: "s", has_todo_custom_fields: true };
    expect(hasTodoCustomFields()).toBe(true);
    window.boot = { sitename: "s" };
    expect(hasTodoCustomFields()).toBe(false);
  });
});

describe("todoFields", () => {
  it("reads the custom fields only when the site has them", () => {
    expect(todoFields(false)).not.toContain("custom_title");
    expect(todoFields(true)).toEqual(
      expect.arrayContaining([
        "custom_title",
        "custom_from_time",
        "custom_to_time",
      ]),
    );
  });
});

describe("todoTitle", () => {
  it("prefers the custom title", () => {
    expect(todoTitle(doc({ custom_title: "Brief" }))).toBe("Brief");
  });

  it("falls back to the description's text, then Untitled", () => {
    expect(todoTitle(doc())).toBe("Write the brief");
    expect(todoTitle(doc({ description: "<p> </p>" }))).toBe("Untitled");
    expect(todoTitle(doc({ description: null }))).toBe("Untitled");
  });
});

describe("formatTodoDateTime", () => {
  it("shows day, month and a lowercase 12-hour time", () => {
    expect(formatTodoDateTime("2026-03-03 14:30:00")).toBe("3 Mar, 02:30 pm");
    expect(formatTodoDateTime("2026-03-03 09:05:00")).toBe("3 Mar, 09:05 am");
  });

  it("shows a dash when unset and the raw value when unreadable", () => {
    expect(formatTodoDateTime(null)).toBe("—");
    expect(formatTodoDateTime("")).toBe("—");
    expect(formatTodoDateTime("soon")).toBe("soon");
  });

  describe("in another time zone", () => {
    const system = getConfig("systemTimezone");
    const local = getConfig("localTimezone");
    afterEach(() => {
      setConfig("systemTimezone", system);
      setConfig("localTimezone", local);
    });

    it("shows the system time in the user's time zone", () => {
      setConfig("systemTimezone", "Asia/Kolkata");
      setConfig("localTimezone", "America/New_York");
      expect(formatTodoDateTime("2026-10-22 19:30:00")).toBe(
        "22 Oct, 10:00 am",
      );
      expect(formatTodoDateTime("2026-10-23 05:00:00")).toBe(
        "22 Oct, 07:30 pm",
      );
    });
  });
});

describe("resolveTodos", () => {
  it("adds the assignee's name and image, or the email when unknown", () => {
    const [known, unknown] = resolveTodos(
      [doc(), doc({ name: "TD-2", allocated_to: "b@example.com" })],
      [{ name: "a@example.com", full_name: "Ann", user_image: "/a.png" }],
      { "TD-2": milestone },
    );
    expect(known).toMatchObject({
      assigneeName: "Ann",
      assigneeImage: "/a.png",
      linked: null,
    });
    expect(unknown).toMatchObject({
      assigneeName: "b@example.com",
      assigneeImage: null,
      linked: milestone,
    });
  });
});

describe("assigneeIds", () => {
  it("lists each assignee once, sorted", () => {
    expect(
      assigneeIds([
        doc({ allocated_to: "b@example.com" }),
        doc({ allocated_to: "a@example.com" }),
        doc({ allocated_to: "b@example.com" }),
      ]),
    ).toEqual(["a@example.com", "b@example.com"]);
  });
});

describe("validateTodo", () => {
  it("accepts a complete ToDo", () => {
    expect(validateTodo(form(), true)).toEqual({});
  });

  it("requires title, start and end only with the custom fields", () => {
    const blank = form({ title: " ", startAt: "", endAt: "" });
    expect(validateTodo(blank, true)).toEqual({
      title: "Title is required.",
      startAt: "Start is required.",
      endAt: "End is required.",
    });
    expect(validateTodo(blank, false)).toEqual({});
  });

  it("requires an assignee", () => {
    expect(validateTodo(form({ assignee: "" }), false)).toEqual({
      assignee: "Assignee is required.",
    });
  });

  it("rejects an end before the start, and allows the same time", () => {
    expect(validateTodo(form({ endAt: "2026-10-01 08:59:00" }), true)).toEqual({
      endAt: "End must be on or after start.",
    });
    expect(validateTodo(form({ endAt: "2026-10-01 09:00:00" }), true)).toEqual(
      {},
    );
  });
});

describe("toTodoFields", () => {
  it("writes the custom fields only when the site has them", () => {
    expect(toTodoFields(form(), false)).toEqual({
      description: "",
      status: "Open",
      allocated_to: "a@example.com",
      priority: "Medium",
    });
    expect(toTodoFields(form(), true)).toMatchObject({
      custom_title: "Brief",
      custom_from_time: "2026-10-01 09:00:00",
      custom_to_time: "2026-10-01 17:00:00",
    });
  });
});

describe("deleteTodoMessage and unlinkTodoMessage", () => {
  it("names the ToDo", () => {
    expect(deleteTodoMessage({ ...doc(), linked: null })).toBe(
      'Are you sure you want to delete the ToDo "Write the brief"? This action cannot be undone.',
    );
  });

  it("names the record a linked ToDo is removed from", () => {
    expect(deleteTodoMessage({ ...doc(), linked: milestone })).toBe(
      'Are you sure you want to delete the ToDo "Write the brief"? It will also be removed from the milestone "Launch". This action cannot be undone.',
    );
    expect(unlinkTodoMessage(doc(), milestone)).toBe(
      'Are you sure you want to unlink the ToDo "Write the brief" from the milestone "Launch"? The ToDo will not be deleted.',
    );
  });
});

describe("linked records", () => {
  const touchpoint: LinkedRecord = {
    doctype: "Project Timeline Item",
    name: "PTI-2",
    title: "Kick-off call",
    type: "Touchpoint",
  };
  const initiative: LinkedRecord = {
    doctype: "PMS Growth Initiative",
    name: "GI-1",
    title: "Upsell",
    type: "Growth Initiative",
  };

  it("matches records by doctype and name", () => {
    expect(linkKey(milestone)).toBe("Project Timeline Item/PTI-1");
    const renamed: LinkedRecord = { ...milestone, title: "Renamed" };
    expect(isSameRecord(milestone, renamed)).toBe(true);
    expect(isSameRecord(milestone, touchpoint)).toBe(false);
    expect(isSameRecord(milestone, null)).toBe(false);
  });

  it("counts ToDos", () => {
    expect(formatTodoCount(1)).toBe("1 ToDo");
    expect(formatTodoCount(3)).toBe("3 ToDos");
  });

  it("groups the linked ToDos by record, in order", () => {
    const todos = resolveTodos(
      [
        doc(),
        doc({ name: "TD-2" }),
        doc({ name: "TD-3" }),
        doc({ name: "TD-4" }),
      ],
      [],
      { "TD-1": milestone, "TD-3": touchpoint, "TD-4": milestone },
    );
    const byRecord = todosByRecord(todos);
    const names = (record: LinkedRecord) =>
      byRecord.get(linkKey(record))?.map((todo) => todo.name);
    expect(names(milestone)).toEqual(["TD-1", "TD-4"]);
    expect(names(touchpoint)).toEqual(["TD-3"]);
    expect(byRecord.size).toBe(2);
  });

  it("groups the link options by type, leaving out empty groups", () => {
    expect(linkOptions([touchpoint, milestone])).toEqual([
      {
        group: "Milestones",
        options: [
          {
            label: "Launch",
            value: "Project Timeline Item/PTI-1",
            icon: "lucide-sparkle",
          },
        ],
      },
      {
        group: "Touchpoints",
        options: [
          {
            label: "Kick-off call",
            value: "Project Timeline Item/PTI-2",
            icon: "lucide-zap",
          },
        ],
      },
    ]);
  });

  it("opens a milestone or touchpoint in the Calendar's list, an initiative in Growth", () => {
    expect(linkedRecordQuery(milestone)).toEqual({
      tab: "calendar",
      view: "list",
      type: "milestones",
      search: "Launch",
    });
    expect(linkedRecordQuery(touchpoint)).toMatchObject({
      type: "touchpoints",
    });
    expect(linkedRecordQuery(initiative)).toEqual({
      tab: "growth",
      growth: "GI-1",
    });
  });
});

describe("statusIcon, statusColor and statusHoverColor", () => {
  it("returns the status's own icon and colours", () => {
    expect(statusIcon("Closed")).toBe("lucide-circle-check");
    expect(statusColor("Closed")).toBe("text-ink-gray-8");
    expect(statusHoverColor("Closed")).toBeUndefined();
    expect(statusIcon("In Progress")).toBe("lucide-circle-dot");
    expect(statusColor("Backlog")).toBe("text-ink-gray-4");
    expect(statusHoverColor("Open")).toBe("hover:text-ink-gray-8");
  });

  it("falls back to Open's for a status the app doesn't know", () => {
    expect(statusIcon("Waiting")).toBe(statusIcon("Open"));
    expect(statusColor("toString")).toBe(statusColor("Open"));
    expect(statusHoverColor("Waiting")).toBe(statusHoverColor("Open"));
  });
});

describe("todoStatuses and statusOptions", () => {
  const boot = window.boot;
  afterEach(() => {
    window.boot = boot;
  });

  it("uses the stock statuses without boot options", () => {
    window.boot = { sitename: "s" };
    expect(todoStatuses()).toEqual(["Open", "Closed", "Cancelled"]);
    window.boot = { sitename: "s", todo_status_options: [] };
    expect(todoStatuses()).toEqual(["Open", "Closed", "Cancelled"]);
  });

  it("reads the ToDo doctype's statuses from the boot data", () => {
    window.boot = {
      sitename: "s",
      todo_status_options: ["Open", "Backlog", "In Progress", "Closed"],
    };
    expect(statusOptions("Open").map((option) => option.value)).toEqual([
      "Open",
      "Backlog",
      "In Progress",
      "Closed",
    ]);
  });

  it("adds the current status when it isn't one of them", () => {
    window.boot = { sitename: "s" };
    expect(statusOptions("Backlog").map((option) => option.value)).toEqual([
      "Open",
      "Closed",
      "Cancelled",
      "Backlog",
    ]);
  });
});
