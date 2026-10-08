/**
 * Internal dependencies.
 */
import type { LinkedRecord } from "./types";

type RecordRef = Pick<LinkedRecord, "doctype" | "name">;

const LINK_KEY_SEPARATOR = "::";

export const toLinkKey = (record?: RecordRef | null) =>
  record ? `${record.doctype}${LINK_KEY_SEPARATOR}${record.name}` : "";

export const fromLinkKey = (key: string): RecordRef | null => {
  const index = key.indexOf(LINK_KEY_SEPARATOR);
  if (index === -1) return null;
  return {
    doctype: key.slice(0, index),
    name: key.slice(index + LINK_KEY_SEPARATOR.length),
  };
};

export const formatTodoCount = (count: number) =>
  `${count} ${count === 1 ? "ToDo" : "ToDos"}`;

export const getDeleteDescription = (label: string, todoCount: number) =>
  todoCount
    ? `This ${label} has ${formatTodoCount(todoCount)} linked, which will be kept. Are you sure you want to delete this ${label}? This action cannot be undone.`
    : `Are you sure you want to delete this ${label}? This action cannot be undone.`;
