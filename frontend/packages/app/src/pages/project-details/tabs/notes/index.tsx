/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { INITIAL_NOTES } from "./fake-data";
import { NoteCard } from "./noteCard";
import { NotesSubHeader } from "./sub-header";
import type { Note } from "./types";
import { useNotesFilters } from "./useNotesFilters";

const applyFilters = (notes: Note[], filters: FilterCondition[]): Note[] => {
  if (!filters.length) return notes;
  return notes.filter((note) =>
    filters.every((f) => {
      if (!f.field || !f.operator) return true;
      if (f.field === "author") {
        const email = String(f.value ?? "");
        if (!email) return true;
        return f.operator === "is_not"
          ? note.author.email !== email
          : note.author.email === email;
      }
      if (f.field === "createdAt" && Array.isArray(f.value)) {
        const [from, to] = f.value as string[];
        if (from && note.createdAt < from) return false;
        if (to && note.createdAt > to) return false;
      }
      return true;
    }),
  );
};

export function Notes() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const { filters, setAdvanced } = useNotesFilters();

  const visible = useMemo(() => {
    const filtered = applyFilters(notes, filters.advanced);
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notes, filters.advanced]);

  const handleDelete = useCallback(
    (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id)),
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <NotesSubHeader
        advanced={filters.advanced}
        onAdvancedChange={setAdvanced}
      />
      {visible.length === 0 ? (
        <div className="py-10 text-center text-sm text-ink-gray-4">
          No notes match the current filters
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {visible.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
