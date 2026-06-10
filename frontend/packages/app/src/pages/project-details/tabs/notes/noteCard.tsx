/**
 * External dependencies.
 */
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar, Dropdown } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { formatRelativeTimeShort, stripTags } from "@/lib/utils";
import { NOTE_PARAM } from "./constants";
import { useNotes } from "./context";
import type { Note } from "./types";

type NoteCardProps = {
  note: Note;
};

export function NoteCard({ note }: NoteCardProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { deleteNote } = useNotes((s) => s.actions);
  const isDeleting = useNotes((s) => s.state.isDeleting);
  const { projectId = "" } = useParams<{ projectId: string }>();
  const excerpt = stripTags(note.description);
  const relativeDate = formatRelativeTimeShort(note.creation, new Date(), true);
  const authorHref = `/desk/user/${encodeURIComponent(note.owner)}`;

  const openDetail = () =>
    setSearchParams((prev) => {
      prev.set(NOTE_PARAM, note.name);
      return prev;
    });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          openDetail();
        }
      }}
      className="flex h-64 min-w-65.75 max-w-131.5 flex-1 cursor-pointer flex-col rounded-[12px] border border-outline-gray-2 bg-surface-white overflow-clip shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-gray-4"
    >
      <div className="flex items-center gap-3 px-3.5 pt-3.5">
        <h3 className="flex-1 truncate text-lg font-medium text-ink-gray-8">
          {note.title}
        </h3>
        <span onClick={(e) => e.stopPropagation()}>
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
                disabled: isDeleting,
                onClick: () =>
                  navigate(
                    `${ROUTES.project}/${projectId}/notes/${note.name}/edit`,
                  ),
              },
              {
                label: "Delete",
                key: "delete",
                theme: "red",
                disabled: isDeleting,
                onClick: () => deleteNote(note.name),
              },
            ]}
          />
        </span>
      </div>
      <p className="flex-1 line-clamp-7 whitespace-pre-wrap px-3.5 pt-2 text-base leading-6 text-ink-gray-5">
        {excerpt}
      </p>
      <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-3">
        <a
          href={authorHref}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 flex items-center"
        >
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
