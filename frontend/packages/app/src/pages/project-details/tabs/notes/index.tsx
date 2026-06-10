/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system";
import { ErrorFallback, Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useNotes } from "./context";
import { NoteCard } from "./noteCard";
import { NotesSubHeader } from "./subHeader";

function NotesGrid() {
  const notes = useNotes((s) => s.state.notes);
  const isLoading = useNotes((s) => s.state.isLoading);
  const error = useNotes((s) => s.state.error);
  const filters = useNotes((s) => s.state.filters);
  const authorOptions = useNotes((s) => s.state.authorOptions);
  const setTitleInput = useNotes((s) => s.actions.setTitleInput);
  const setDescriptionInput = useNotes((s) => s.actions.setDescriptionInput);
  const setAuthor = useNotes((s) => s.actions.setAuthor);

  if (error) throw error;

  const hasFilter = Boolean(
    filters.title.trim() || filters.description.trim() || filters.author,
  );

  return (
    // The height is calculated by subtracting the height of the header.
    <div className="relative flex h-full min-h-[calc(100dvh-var(--spacing)*24)]  flex-col gap-4">
      <NotesSubHeader
        titleInput={filters.title}
        descriptionInput={filters.description}
        author={filters.author}
        authorOptions={authorOptions}
        onTitleInputChange={setTitleInput}
        onDescriptionInputChange={setDescriptionInput}
        onAuthorChange={setAuthor}
      />
      <div
        className={cn("flex flex-col", {
          "opacity-50 transition-opacity duration-150": isLoading,
        })}
      >
        {notes.length === 0 ? (
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
      {isLoading && (
        <Spinner
          isFull
          className="absolute top-0 left-0 h-[calc(100dvh-var(--spacing)*24)]  w-full cursor-wait z-10"
        />
      )}
    </div>
  );
}

export function Notes() {
  return (
    <ErrorFallback>
      <NotesGrid />
    </ErrorFallback>
  );
}
