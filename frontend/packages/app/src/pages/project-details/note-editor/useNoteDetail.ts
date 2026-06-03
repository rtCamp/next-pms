import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

import type { Note } from "@/pages/project-details/tabs/notes/types";

const NOTE_DETAIL_API =
  "next_pms.timesheet.api.project_status_update.get_project_status_update";

export function useNoteDetail(noteId: string | undefined) {
  const params = useMemo(() => ({ name: noteId ?? "" }), [noteId]);
  const swrKey = useMemo(
    () => (noteId ? `note-detail-${noteId}` : null),
    [noteId],
  );

  const { data, isLoading, error } = useFrappeGetCall<{ message: Note }>(
    NOTE_DETAIL_API,
    params,
    swrKey,
  );

  return {
    note: data?.message,
    isLoading: noteId ? isLoading : false,
    error,
  };
}
