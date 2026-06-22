/**
 * External dependencies.
 */
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { formatRelativeTimeShort } from "@next-pms/design-system/utils";
import { Avatar, StaticTextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { NOTE_PARAM } from "./constants";
import { NoteActions } from "./noteActions";
import type { Note } from "./types";

type NoteCardProps = {
  note: Note;
};

export function NoteCard({ note }: NoteCardProps) {
  const [, setSearchParams] = useSearchParams();
  const relativeDate = formatRelativeTimeShort(note.creation, new Date(), true);
  const authorHref = `/desk/user/${encodeURIComponent(note.owner)}`;
  const authorName = note.owner_full_name?.trim() || "";

  const openDetail = useCallback(() => {
    setSearchParams((prev) => {
      prev.set(NOTE_PARAM, note.name);
      return prev;
    });
  }, [note.name, setSearchParams]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (
          e.target === e.currentTarget &&
          (e.key === "Enter" || e.key === " ")
        ) {
          e.preventDefault();
          openDetail();
        }
      }}
      className="flex h-64 min-w-65.75 max-w-131.5 flex-1 cursor-pointer flex-col rounded-[12px] border border-outline-gray-2 bg-surface-white overflow-clip shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-gray-4"
    >
      <div className="flex justify-between items-center gap-2 px-3.5 pt-3.5">
        <h3 className="flex-1 truncate text-lg font-medium text-ink-gray-8">
          {note.title}
        </h3>
        <NoteActions note={note} />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <StaticTextEditor
          content={note.description}
          editorClass="prose-sm px-3.5 pt-2"
        />
        <span className="absolute block left-0 bottom-0 z-10 w-full h-12 from-surface-white to-transparent pointer-events-none bg-linear-to-t"></span>
      </div>
      <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-3">
        <a
          href={authorHref}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 flex items-center"
        >
          <Avatar
            size="xs"
            label={authorName}
            image={note.owner_image || undefined}
          />
        </a>
        <span className="flex-1 truncate leading-tight text-sm text-ink-gray-5">
          {authorName}
        </span>
        <span className="shrink-0 text-base text-ink-gray-5">
          {relativeDate}
        </span>
      </div>
    </div>
  );
}
