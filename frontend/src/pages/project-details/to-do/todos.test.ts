import { afterEach, describe, expect, it } from "vitest";
import {
  assigneeIds,
  deleteTodoMessage,
  emptyTodoForm,
  formatTodoDateTime,
  hasTodoCustomFields,
  todoFields,
  todoTitle,
  toTodoFields,
  validateTodo,
  withAssignees,
} from "./todos";
import type { TodoDoc, TodoForm } from "./types";

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
});

describe("withAssignees", () => {
  it("adds the assignee's name and image, or the email when unknown", () => {
    const [known, unknown] = withAssignees(
      [doc(), doc({ name: "TD-2", allocated_to: "b@example.com" })],
      [{ name: "a@example.com", full_name: "Ann", user_image: "/a.png" }],
    );
    expect(known).toMatchObject({
      assigneeName: "Ann",
      assigneeImage: "/a.png",
    });
    expect(unknown).toMatchObject({
      assigneeName: "b@example.com",
      assigneeImage: null,
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

describe("deleteTodoMessage", () => {
  it("names the ToDo", () => {
    expect(deleteTodoMessage(doc())).toBe(
      'Are you sure you want to delete the ToDo "Write the brief"? This action cannot be undone.',
    );
  });
});
