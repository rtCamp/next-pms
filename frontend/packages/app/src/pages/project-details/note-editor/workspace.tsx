import { useEffect, useRef } from "react";
import { TextEditor } from "@rtcamp/frappe-ui-react";

import type { NoteEditorMode } from "./types";

type NoteEditorWorkspaceProps = {
  mode: NoteEditorMode;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export function NoteEditorWorkspace({
  mode,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: NoteEditorWorkspaceProps) {
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (mode === "new" && titleRef.current) {
      titleRef.current.focus();
    }
  }, [mode]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  return (
    <div className="flex flex-col gap-2 pt-8">
      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget.nextElementSibling as HTMLElement | null)
              ?.querySelector<HTMLElement>("[contenteditable=true]")
              ?.focus();
          }
        }}
        placeholder="Add note title"
        rows={1}
        aria-label="Note title"
        className="w-full resize-none border-0 bg-transparent text-3xl font-semibold leading-tight text-ink-gray-8 placeholder:text-ink-gray-4 focus:outline-none"
      />
      <TextEditor
        content={description}
        onChange={onDescriptionChange}
        placeholder="Type / to format and insert"
        editable
        editorClass="prose prose-sm max-w-none min-h-[400px] text-ink-gray-8 focus:outline-none"
      />
    </div>
  );
}
