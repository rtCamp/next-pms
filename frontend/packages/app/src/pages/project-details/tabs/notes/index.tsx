/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { ErrorFallback, Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { UnderConstruction } from "@/components/under-construction";
import { NOTE_ID, NOTE_MODE } from "./constants";
import { useNotes } from "./context";
import { NoteEditor } from "./editor";
import { NoteCard } from "./noteCard";
import { NotesProvider } from "./provider";
import { NotesSubHeader } from "./subHeader";

function NotesGrid() {
  const notes = useNotes((s) => s.state.notes);
  const isLoading = useNotes((s) => s.state.isLoading);
  const error = useNotes((s) => s.state.error);
  const filters = useNotes((s) => s.state.filters);
  const setFilters = useNotes((s) => s.actions.setFilters);

  if (error) throw error;

  const hasFilter = filters.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <NotesSubHeader filters={filters} onFiltersChange={setFilters} />
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

function NotesContent() {
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get(NOTE_ID);
  const noteMode = searchParams.get(NOTE_MODE);

  const activeView =
    noteId && noteMode === "edit"
      ? "edit"
      : noteMode === "new"
        ? "new"
        : noteId
          ? "details"
          : "list";

  switch (activeView) {
    case "new":
    case "edit":
      return <NoteEditor noteId={noteId} mode={activeView} />;

    case "details":
      return <UnderConstruction />;

    default:
      return <NotesGrid />;
  }
}

export function Notes() {
  return (
    <ErrorFallback>
      <NotesProvider>
        <NotesContent />
      </NotesProvider>
    </ErrorFallback>
  );
}
