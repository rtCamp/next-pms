/**
 * External dependencies.
 */
import { Avatar, Dropdown } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { Note } from "./types";

type NoteCardProps = {
  note: Note;
  onDelete: (id: string) => void;
};

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const relativeDate = formatDistanceToNow(parseISO(note.createdAt), {
    addSuffix: true,
  });
  const authorHref = `/desk/user/${encodeURIComponent(note.author.email)}`;

  return (
    <div className="flex h-64 flex-col rounded-[12px] border border-outline-gray-1 bg-surface-white overflow-clip">
      <div className="flex items-center gap-3 px-[14px] pt-[14px]">
        <h3 className="flex-1 truncate text-lg font-medium text-ink-gray-8">
          {note.title}
        </h3>
        <Dropdown
          placement="right"
          button={{
            variant: "ghost",
            size: "sm",
            icon: DotHorizontal,
            "aria-label": "Note actions",
          }}
          options={[
            {
              label: "Delete",
              key: "delete",
              theme: "red",
              icon: <Trash2 className="size-4 mr-2" />,
              onClick: () => onDelete(note.id),
            },
          ]}
        />
      </div>
      <p className="flex-1 line-clamp-[7] whitespace-pre-wrap px-[14px] pt-1 text-base leading-relaxed text-ink-gray-5">
        {note.excerpt}
      </p>
      <div className="flex items-center gap-2 px-[14px] pb-[14px] pt-3">
        <a href={authorHref} className="shrink-0">
          <Avatar size="xs" label={note.author.name} />
        </a>
        <span className="flex-1 truncate text-sm text-ink-gray-5">
          {note.author.name}
        </span>
        <span className="shrink-0 text-base text-ink-gray-5">
          {relativeDate}
        </span>
      </div>
    </div>
  );
}
