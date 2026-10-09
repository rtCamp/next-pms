/**
 * Internal dependencies.
 */
import type { RecordRef } from "./types";

export const linkKey = (record: RecordRef) =>
  `${record.doctype}/${record.name}`;

export const isSameRecord = (a?: RecordRef | null, b?: RecordRef | null) =>
  Boolean(a && b && a.doctype === b.doctype && a.name === b.name);

export const formatTodoCount = (count: number) =>
  `${count} ${count === 1 ? "ToDo" : "ToDos"}`;

export const getDeleteDescription = (label: string, todoCount: number) =>
  todoCount
    ? `This ${label} has ${formatTodoCount(todoCount)} linked, which will be kept. Are you sure you want to delete this ${label}? This action cannot be undone.`
    : `Are you sure you want to delete this ${label}? This action cannot be undone.`;
