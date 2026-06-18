/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { ErrorFallback, Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { NOTE_PARAM } from "./constants";
import { useNotes } from "./context";
import { DeleteNoteDialog } from "./deleteNoteDialog";
import { NoteDetail } from "./detail";
import { NoteCard } from "./noteCard";
import { NotesSubHeader } from "./subHeader";

function NotesGrid() {
  const notes = useNotes((s) => s.state.notes);
  const isLoading = useNotes((s) => s.state.isLoading);
  const error = useNotes((s) => s.state.error);

  if (error) throw error;

  return (
    // The height is calculated by subtracting the height of the header.
    <div className="relative flex flex-col gap-4">
      <NotesSubHeader />
      <div
        className={cn(
          "flex flex-col h-[calc(100dvh-var(--spacing)*55)] overflow-y-auto scrollbar-thin",
          {
            "opacity-50 transition-opacity duration-150": isLoading,
          },
        )}
      >
        {!isLoading && notes.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-gray-4">
            No notes found
          </div>
        ) : notes.length > 0 ? (
          <div className="flex flex-wrap gap-5">
            {notes.map((note) => (
              <NoteCard key={note.name} note={note} />
            ))}
          </div>
        ) : null}
        {isLoading && (
          <Spinner
            isFull
            className="absolute top-0 left-0 w-full h-full cursor-wait z-10"
          />
        )}
      </div>
    </div>
  );
}

export function Notes() {
  const [searchParams] = useSearchParams();
  const deleteNoteName = useNotes((s) => s.state.deleteNoteName);
  const closeDeleteDialog = useNotes((s) => s.actions.closeDeleteDialog);
  const noteId = searchParams.get(NOTE_PARAM);

  return (
    <ErrorFallback key={noteId ?? "grid"}>
      {noteId ? <NoteDetail noteId={noteId} /> : <NotesGrid />}
      {deleteNoteName ? (
        <DeleteNoteDialog
          noteName={deleteNoteName}
          onClose={closeDeleteDialog}
        />
      ) : null}
    </ErrorFallback>
  );
}
