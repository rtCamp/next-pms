/**
 * External dependencies.
 */
import { TextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Note } from "../types";

type NoteDetailContentProps = {
  note: Note;
};

export function NoteDetailContent({ note }: NoteDetailContentProps) {
  return (
    <div className="flex flex-col gap-2 pt-4">
      <h1 className="text-3xl font-semibold leading-tight text-ink-gray-8">
        {note.title}
      </h1>
      <TextEditor
        content={note.description}
        editable={false}
        fixedMenu={false}
        editorClass="prose prose-sm max-w-none text-ink-gray-8"
      />
    </div>
  );
}
