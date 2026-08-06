/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { TextEditor } from "@rtcamp/frappe-ui-react";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * Internal dependencies.
 */
import { useNotes } from "../context";
import type { Note } from "../types";

/** Stable across renders, otherwise every render rebuilds the editor. */
const EDITOR_EXTENSION_OPTIONS = {
  taskItem: { toggleWhenReadOnly: true },
};

type NoteDetailContentProps = {
  note: Note;
};

export function NoteDetailContent({ note }: NoteDetailContentProps) {
  const updateNote = useNotes((s) => s.actions.updateNote);
  const [description, setDescription] = useState(note.description);
  const debouncedDescription = useDebounce(description);

  useEffect(() => {
    if (debouncedDescription === note.description) return;

    updateNote(note.name, { description: debouncedDescription });
  }, [debouncedDescription, note.description, note.name, updateNote]);

  return (
    <div className="flex flex-col gap-1.5 pt-3">
      <h1 className="text-3xl font-semibold leading-tight text-ink-gray-7">
        {note.title}
      </h1>
      <TextEditor
        onChange={setDescription}
        editable={false}
        extensionOptions={EDITOR_EXTENSION_OPTIONS}
        content={note.description}
        editorClass="prose prose-sm max-w-none text-ink-gray-6 [&_:is(h1,h2,h3,h4,h5,h6)]:text-ink-gray-7"
      />
    </div>
  );
}
