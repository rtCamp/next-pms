/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useNotes } from "../context";
import { NoteDetailContent } from "./content";
import { NoteDetailHeader } from "./header";
import { NoteComments } from "./noteComments";

type NoteDetailProps = {
  noteId: string;
};

export function NoteDetail({ noteId }: NoteDetailProps) {
  const isLoading = useNotes((s) => s.state.isLoading);
  const notes = useNotes((s) => s.state.notes);
  const noteFromList = notes.find((note) => note.name === noteId);
  const note = noteFromList ?? null;

  if (isLoading && !note) {
    return <Spinner className="py-10" />;
  }

  if (!note) {
    return (
      <div className="py-10 text-center text-sm text-ink-gray-4">
        Note not found
      </div>
    );
  }

  return (
    <div className="w-full">
      <NoteDetailHeader note={note} />
      <NoteDetailContent note={note} />
      <NoteComments noteId={note.name} />
    </div>
  );
}
