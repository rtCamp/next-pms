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
import type { Note, NoteFilters, NoteUserDetails } from "./types";

export function useNotesData(filters: NoteFilters) {
  const projectId = useProjectDetail((s) => s.projectId);

  const frappeFilters = useMemo(() => {
    const base: unknown[] = [
      ["project", "=", projectId],
      ["status", "=", "Publish"],
    ];

    const title = filters.title.trim();
    const description = filters.description.trim();

    if (title) base.push(["title", "like", `%${title}%`]);
    if (description) {
      base.push(["description", "like", `%${description}%`]);
    }

    return base;
  }, [projectId, filters.title, filters.description]);

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

  const allOwners = useMemo(() => {
    if (!data?.length) return [];
    return [...new Set(data.map((note) => note.owner).filter(Boolean))];
  }, [data]);

  const usersSwrKey = useMemo(() => {
    if (!allOwners.length) return null;
    return `notes-users-${hashString(allOwners.slice().sort().join(","))}`;
  }, [allOwners]);

  const { data: usersData } = useFrappeGetDocList<NoteUserDetails>(
    "User",
    {
      fields: ["name", "full_name", "user_image"],
      filters: allOwners.length ? [["name", "in", allOwners]] : [],
      limit: allOwners.length || 1,
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
      const ownerDetails = userMap[note.owner];

      return {
        ...note,
        owner_full_name: ownerDetails?.full_name || note.owner,
        owner_image: ownerDetails?.user_image ?? null,
      };
    });
  }, [data, userMap]);

  return { notes, isLoading, error, mutate };
}
