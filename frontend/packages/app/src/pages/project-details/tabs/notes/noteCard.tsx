/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { Avatar, Dropdown } from "@rtcamp/frappe-ui-react";
import { DotHorizontal, Edit1 } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { formatRelativeTimeShort, stripTags } from "@/lib/utils";
import { NOTE_ID, NOTE_MODE } from "./constants";
import type { Note } from "./types";

type NoteCardProps = {
  note: Note;
};

export function NoteCard({ note }: NoteCardProps) {
  const [, setSearchParams] = useSearchParams();
  const excerpt = stripTags(note.description);
  const relativeDate = formatRelativeTimeShort(note.creation);
  const authorHref = `/desk/user/${encodeURIComponent(note.owner)}`;

  return (
    <div className="flex h-64 min-w-65.75 max-w-131.5 flex-1 flex-col rounded-[12px] border border-outline-gray-1 bg-surface-white overflow-clip">
      <div className="flex items-center gap-3 px-3.5 pt-3.5">
        <h3 className="flex-1 truncate text-lg font-medium text-ink-gray-8">
          {note.title}
        </h3>
        <Dropdown
          placement="right"
          button={{
            variant: "ghost",
            icon: DotHorizontal,
          }}
          options={[
            {
              label: "Edit",
              key: "edit",
              icon: <Edit1 className="size-4 mr-2" />,
              onClick: () =>
                setSearchParams((prev) => {
                  prev.set(NOTE_ID, note.name);
                  prev.set(NOTE_MODE, "edit");
                  return prev;
                }),
            },
          ]}
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
