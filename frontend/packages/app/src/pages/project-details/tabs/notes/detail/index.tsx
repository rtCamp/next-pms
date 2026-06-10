/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { Note } from "../types";
import { NoteDetailContent } from "./content";
import { NoteDetailHeader } from "./header";

type NoteDetailProps = {
  noteId: string;
};

export function NoteDetail({ noteId }: NoteDetailProps) {
  const { data, isLoading, error } = useFrappeGetCall<{ message: Note }>(
    "next_pms.timesheet.api.project_status_update.get_project_status_update",
    { name: noteId },
  );

  if (error) throw error;

  if (isLoading || !data) {
    return <Spinner className="py-10" />;
  }

  const note = data.message;

  return (
    <div className="flex justify-center">
      <div className="max-w-200 w-full p-4">
        <NoteDetailHeader note={note} />
        <NoteDetailContent note={note} />
      </div>
    </div>
  );
}
