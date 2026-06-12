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

  const { data, isLoading, error, mutate } = useFrappeGetDocList<Note>(
    "Project Status Update",
    {
      fields: [
        "name",
        "title",
        "description",
        "status",
        "project",
        "creation",
        "modified",
        "last_edited_at",
        "last_edited_by",
        "owner",
        "modified_by",
      ],
      filters: frappeFilters as never,
      orderBy: {
        field: "creation",
        order: "desc",
      },
      limit: 500,
    },
    undefined,
    {
      keepPreviousData: true,
    },
  );

  const { data: allAuthorsData } = useFrappeGetDocList<{ owner: string }>(
    "Project Status Update",
    {
      fields: ["owner"],
      filters: [
        ["project", "=", projectId],
        ["status", "=", "Publish"],
      ] as never,
      limit: 500,
    },
  );

  const allAuthors = useMemo(() => {
    if (!allAuthorsData?.length) return [];
    const emails = allAuthorsData
      .map((row) => row.owner)
      .filter(Boolean) as string[];
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
    if (!data?.length) return [];

    return data.map((note) => {
      const authorDetails = userMap[note.owner];

      return {
        ...note,
        owner_full_name: authorDetails?.full_name || note.owner,
        owner_image: authorDetails?.user_image ?? null,
      };
    });
  }, [data, userMap]);

  const authorOptions = useMemo<NoteAuthorOption[]>(
    () => [
      { label: "All", value: "" },
      ...allAuthors.map((email) => ({
        label: userMap[email]?.full_name ?? email,
        value: email,
      })),
    ],
    [allAuthors, userMap],
  );

  return { notes, isLoading, error, mutate, authorOptions };
}
