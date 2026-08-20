/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hashString } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import type { Todo, TodoDoc, TodoUserDetails } from "./types";

export function useTodosData() {
  const projectId = useProjectDetail((s) => s.projectId);

  const filters = useMemo(
    () =>
      [
        ["reference_type", "=", "Project"],
        ["reference_name", "=", projectId],
      ] as unknown,
    [projectId],
  );

  const { data, isLoading, error, mutate } = useFrappeGetDocList<TodoDoc>(
    "ToDo",
    {
      fields: [
        "name",
        "allocated_to",
        "assigned_by",
        "assigned_by_full_name",
        "custom_from_time",
        "custom_title",
        "custom_to_time",
        "date",
        "description",
        "priority",
        "reference_name",
        "reference_type",
        "status",
        "owner",
        "creation",
        "modified",
      ],
      filters: filters as never,
      orderBy: { field: "creation", order: "desc" },
      limit: 500,
    },
    undefined,
    { keepPreviousData: true },
  );

  const assigneeEmails = useMemo(() => {
    if (!data?.length) return [] as string[];
    return [...new Set(data.map((t) => t.allocated_to).filter(Boolean))];
  }, [data]);

  const usersSwrKey = useMemo(() => {
    if (!assigneeEmails.length) return null;
    return `todos-users-${hashString(assigneeEmails.slice().sort().join(","))}`;
  }, [assigneeEmails]);

  const { data: usersData } = useFrappeGetDocList<TodoUserDetails>(
    "User",
    {
      fields: ["name", "full_name", "user_image"],
      filters: assigneeEmails.length
        ? ([["name", "in", assigneeEmails]] as never)
        : [],
      limit: assigneeEmails.length || 1,
    },
    usersSwrKey,
  );

  const userMap = useMemo(
    () =>
      Object.fromEntries((usersData ?? []).map((user) => [user.name, user])),
    [usersData],
  );

  const todos = useMemo<Todo[]>(() => {
    if (!data?.length) return [];
    return data.map((t) => {
      const u = userMap[t.allocated_to];
      return {
        ...t,
        allocated_to_full_name: u?.full_name || t.allocated_to,
        allocated_to_image: u?.user_image ?? null,
      };
    });
  }, [data, userMap]);

  return { todos, isLoading, error, mutate };
}
