import { Spinner } from "@next-pms/design-system/components";

import { useNotes } from "./context";
import { NoteCard } from "./noteCard";
import { NotesSubHeader } from "./sub-header";

export function Notes() {
  const notes = useNotes((s) => s.state.notes);
  const isLoading = useNotes((s) => s.state.isLoading);
  const error = useNotes((s) => s.state.error);
  const advanced = useNotes((s) => s.state.filters.advanced);
  const setAdvanced = useNotes((s) => s.actions.setAdvanced);

  if (error) throw error;

  const hasFilter = advanced.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <NotesSubHeader advanced={advanced} onAdvancedChange={setAdvanced} />
      {isLoading ? (
        <Spinner className="py-10" />
      ) : notes.length === 0 ? (
        <div className="py-10 text-center text-sm text-ink-gray-4">
          {hasFilter
            ? "No notes match the current filters"
            : "No notes yet for this project"}
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {notes.map((note) => (
            <NoteCard key={note.name} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
