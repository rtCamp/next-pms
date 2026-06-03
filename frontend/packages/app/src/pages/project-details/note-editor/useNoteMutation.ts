import { useCallback } from "react";
import { useFrappePostCall } from "frappe-react-sdk";

import type { Note } from "@/pages/project-details/tabs/notes/types";
import type { NoteDraft } from "./types";

const CREATE_API =
  "next_pms.timesheet.api.project_status_update.create_project_status_update";
const UPDATE_API =
  "next_pms.timesheet.api.project_status_update.update_project_status_update";

type Params =
  | { mode: "new"; projectId: string; noteId?: undefined }
  | { mode: "edit"; projectId: string; noteId: string };

type SaveResult = { message: Note };

export function useNoteMutation({ mode, projectId, noteId }: Params) {
  const { call: createCall, loading: isCreating } =
    useFrappePostCall<SaveResult>(CREATE_API);
  const { call: updateCall, loading: isUpdating } =
    useFrappePostCall<SaveResult>(UPDATE_API);

  const save = useCallback(
    async (draft: NoteDraft): Promise<Note> => {
      const payload = {
        title: draft.title.trim(),
        description: draft.description,
      };
      if (mode === "new") {
        const res = await createCall({
          project: projectId,
          ...payload,
          status: "Publish",
        });
        return res.message;
      }
      const res = await updateCall({ name: noteId, ...payload });
      return res.message;
    },
    [mode, projectId, noteId, createCall, updateCall],
  );

  return { save, isSubmitting: isCreating || isUpdating };
}
