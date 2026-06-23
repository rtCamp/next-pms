/**
 * External dependencies.
 */
import { useMemo, useCallback } from "react";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hashString } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import type {
  Note,
  NoteAuthorOption,
  NoteFilters,
  NoteUserDetails,
} from "./types";

export function useNotesData(filters: NoteFilters) {
  const projectId = useProjectDetail((s) => s.projectId);

  const frappeFilters = useMemo(() => {
    const base: unknown[] = [
      ["project", "=", projectId],
      ["status", "=", "Publish"],
    ];

    const title = filters.title.trim();
    const description = filters.description.trim();

    if (filters.author) base.push(["owner", "=", filters.author]);
    if (title) base.push(["title", "like", `%${title}%`]);
    if (description) {
      base.push(["description", "like", `%${description}%`]);
    }

    return base;
  }, [projectId, filters.author, filters.title, filters.description]);

  const { data, isLoading, error, mutate } = useFrappeGetCall<{
    message: Note[];
  }>(
    "frappe.client.get_list",
    {
      doctype: "Project Status Update",
      fields: [
        "name",
        "title",
        "description",
        "status",
        "project",
        "pinned",
        "creation",
        "modified",
        "last_edited_at",
        "last_edited_by",
        "owner",
        "modified_by",
      ],
      filters: frappeFilters,
      order_by: "pinned desc, creation desc",
      limit_page_length: 500,
    },
    projectId ? undefined : null,
    {
      keepPreviousData: true,
    },
  );

  const { data: allAuthorsData, mutate: mutateAuthors } = useFrappeGetDocList<{
    owner: string;
  }>("Project Status Update", {
    fields: ["owner"],
    filters: [
      ["project", "=", projectId],
      ["status", "=", "Publish"],
    ] as never,
    limit: 500,
  });

  const allAuthors = useMemo(() => {
    const emails = (allAuthorsData ?? [])
      .map((row) => row.owner)
      .filter(Boolean) as string[];

    if (!emails.length) return [];
    return [...new Set(emails)];
  }, [allAuthorsData]);

  const usersSwrKey = useMemo(() => {
    if (!allAuthors.length) return null;
    return `notes-users-${hashString(allAuthors.slice().sort().join(","))}`;
  }, [allAuthors]);

  const { data: usersData } = useFrappeGetDocList<NoteUserDetails>(
    "User",
    {
      fields: ["name", "full_name", "user_image"],
      filters: allAuthors.length ? [["name", "in", allAuthors]] : [],
      limit: allAuthors.length || 1,
    },
    usersSwrKey,
  );

  const userMap = useMemo(
    () =>
      Object.fromEntries((usersData ?? []).map((user) => [user.name, user])),
    [usersData],
  );

  const notes = useMemo<Note[]>(() => {
    if (!data?.message?.length) return [];

    return data.message.map((note) => {
      const authorDetails = userMap[note.owner];

      return {
        ...note,
        pinned: Boolean(note.pinned),
        owner_full_name: authorDetails?.full_name?.trim() || "",
        owner_image: authorDetails?.user_image ?? null,
      };
    });
  }, [data, userMap]);

  const authorOptions = useMemo<NoteAuthorOption[]>(
    () => [
      { label: "All", value: "" },
      ...allAuthors
        .map((email) => ({
          label: userMap[email]?.full_name?.trim() || "",
          value: email,
        }))
        .filter((option) => option.label),
    ],
    [allAuthors, userMap],
  );

  const refresh = useCallback(async () => {
    await Promise.all([mutate(), mutateAuthors()]);
  }, [mutate, mutateAuthors]);

  return { notes, isLoading, error, refresh, authorOptions };
}
