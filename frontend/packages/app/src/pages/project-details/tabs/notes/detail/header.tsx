/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { Avatar, Button } from "@rtcamp/frappe-ui-react";
import { ArrowLeft } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { formatRelativeTimeShort } from "@/lib/utils";
import { NOTE_PARAM } from "../constants";
import { NoteActions } from "../noteActions";
import type { Note } from "../types";

type NoteDetailHeaderProps = {
  note: Note;
};

export function NoteDetailHeader({ note }: NoteDetailHeaderProps) {
  const [, setSearchParams] = useSearchParams();
  const lastUpdated = formatRelativeTimeShort(
    note.last_edited_at ?? note.modified,
    new Date(),
    true,
  );
  const authorHref = `/desk/user/${encodeURIComponent(note.owner)}`;

  const handleBack = () => {
    setSearchParams((prev) => {
      prev.delete(NOTE_PARAM);
      return prev;
    });
  };

  return (
    <div className="flex items-center justify-between gap-8">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          type="button"
          onClick={handleBack}
          className="p-0"
          icon={() => <ArrowLeft />}
        />
        <a href={authorHref} className="shrink-0 flex items-center">
          <Avatar
            size="xs"
            shape="circle"
            label={note.owner_full_name}
            image={note.owner_image || undefined}
          />
        </a>
        <span className="truncate text-base font-medium text-ink-gray-8">
          {note.owner_full_name}
        </span>
        <span className="shrink-0 text-ink-gray-5">·</span>
        <span className="shrink-0 text-base text-ink-gray-5">
          last updated {lastUpdated}
        </span>
      </div>
      <NoteActions note={note} />
    </div>
  );
}
