/**
 * External dependencies.
 */
import { StaticTextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Note } from "../types";

type NoteDetailContentProps = {
  note: Note;
};

export function NoteDetailContent({ note }: NoteDetailContentProps) {
  return (
    <div className="flex flex-col gap-1.5 pt-3">
      <h1 className="text-3xl font-semibold leading-tight text-ink-gray-7">
        {note.title}
      </h1>
      <StaticTextEditor
        content={note.description}
        editorClass="prose prose-sm max-w-none text-ink-gray-6 [&_:is(h1,h2,h3,h4,h5,h6)]:text-ink-gray-7"
      />
    </div>
  );
}
