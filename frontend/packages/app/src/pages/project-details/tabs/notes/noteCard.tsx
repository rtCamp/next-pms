/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { formatRelativeTimeShort, stripTags } from "@/lib/utils";
import type { Note } from "./types";

type NoteCardProps = {
  note: Note;
};

export function NoteCard({ note }: NoteCardProps) {
  const excerpt = stripTags(note.description);
  const relativeDate = formatRelativeTimeShort(note.creation);
  const authorHref = `/desk/user/${encodeURIComponent(note.owner)}`;

  return (
    <div className="flex h-64 min-w-65.75 max-w-131.5 flex-1 flex-col rounded-[12px] border border-outline-gray-1 bg-surface-white overflow-clip">
      <div className="flex items-center gap-3 px-3.5 pt-3.5">
        <h3 className="flex-1 truncate text-lg font-medium text-ink-gray-8">
          {note.title}
        </h3>
        {/* TODO: Add actions after requirement clarification */}
        <DotHorizontal
          aria-hidden
          className="size-4 shrink-0 text-ink-gray-5"
        />
      </div>
      <p className="flex-1 line-clamp-7 whitespace-pre-wrap px-3.5 pt-2 text-base leading-6 text-ink-gray-5">
        {excerpt}
      </p>
      <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-3">
        <a href={authorHref} className="shrink-0 flex items-center">
          <Avatar
            size="xs"
            label={note.owner_full_name}
            image={note.owner_image || undefined}
          />
        </a>
        <span className="flex-1 truncate leading-tight text-sm text-ink-gray-5">
          {note.owner_full_name}
        </span>
        <span className="shrink-0 text-base text-ink-gray-5">
          {relativeDate}
        </span>
      </div>
    </div>
  );
}
