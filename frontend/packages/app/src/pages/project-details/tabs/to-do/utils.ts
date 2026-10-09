/**
 * Internal dependencies.
 */
import { extractTextFromHTML } from "@/lib/utils";
import type { LinkedRecord, RecordRef, Todo } from "./types";

export const linkKey = (record: RecordRef) =>
  `${record.doctype}/${record.name}`;

export const isSameRecord = (a?: RecordRef | null, b?: RecordRef | null) =>
  Boolean(a && b && a.doctype === b.doctype && a.name === b.name);

export const formatTodoCount = (count: number) =>
  `${count} ${count === 1 ? "ToDo" : "ToDos"}`;

export const todoTitle = (todo: Todo) =>
  todo.custom_title || extractTextFromHTML(todo.description) || "Untitled";

export const getDeleteDescription = (
  label: string,
  title: string,
  hasTodos: boolean,
) =>
  `Are you sure you want to delete the ${label.toLowerCase()} "${title}"?${
    hasTodos ? " Its linked ToDos will not be deleted." : ""
  } This action cannot be undone.`;

export const getUnlinkDescription = (todo: Todo, record: LinkedRecord) =>
  `Are you sure you want to unlink the ToDo "${todoTitle(todo)}" from the ${record.type.toLowerCase()} "${record.title}"? The ToDo will not be deleted.`;

export const getTodoDeleteDescription = (todo: Todo) =>
  `Are you sure you want to delete the ToDo "${todoTitle(todo)}"?${
    todo.linked
      ? ` It will also be removed from the ${todo.linked.type.toLowerCase()} "${todo.linked.title}".`
      : ""
  } This action cannot be undone.`;
